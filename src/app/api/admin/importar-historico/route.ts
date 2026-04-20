import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Credenciales de Supabase faltantes');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
};

// ─────────────────────────────────────────────────────────────────
// POST /api/admin/importar-historico
// Body: array de filas parseadas del Excel
// ─────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const { user, error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  const userRole = user?.user_metadata?.role || '';
  const userCcaaId = user?.user_metadata?.ccaa_id || null;

  try {
    const rows: any[] = await request.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'El archivo está vacío o tiene formato incorrecto.' }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'El archivo supera el límite de 500 filas por importación.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Precargar catálogos completos para minimizar queries por fila
    const [{ data: allProvincias }, { data: allSectores }, { data: allOrganos }, { data: allSindicatos }, { data: allCcaa }] = await Promise.all([
      supabase.from('provincias').select('id, nombre, ccaa_id'),
      supabase.from('sectores').select('id, nombre'),
      supabase.from('tipos_organos').select('id, nombre'),
      supabase.from('sindicatos').select('id, siglas'),
      supabase.from('ccaa').select('id, nombre'),
    ]);

    // Mapas rápidos de búsqueda (normalize: sin tildes, mayúsculas)
    const normalize = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();

    const provMap = new Map((allProvincias || []).map(p => [normalize(p.nombre), p]));
    const sectMap = new Map((allSectores || []).map(s => [normalize(s.nombre), s]));
    const orgMap  = new Map((allOrganos || []).map(o => [normalize(o.nombre), o]));
    const sindMap = new Map((allSindicatos || []).map(s => [normalize(s.siglas), s]));

    // Obtener MAX id de sindicatos para inserción secuencial
    const { data: maxSindRecord } = await supabase
      .from('sindicatos').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    let nextSindId = (maxSindRecord?.id || 0) + 1;

    let importadas = 0;
    let actualizadas = 0;
    const errores: { fila: number; motivo: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const fila = i + 2; // Excel es 1-indexed y la primera fila son cabeceras
      const row = rows[i];

      try {
        // ── Validar campos obligatorios ──
        const rawProvincia = row['PROVINCIA']?.toString().trim();
        const rawSector    = row['SECTOR']?.toString().trim();
        const rawOrgano    = row['TIPO_ORGANO']?.toString().trim();
        const rawUnidad    = row['UNIDAD_ELECTORAL']?.toString().trim();
        const rawAnio      = parseInt(row['AÑO'] || row['ANO'] || '0');
        const rawCenso     = parseInt(row['CENSO'] || '0');
        const rawDelTotal  = parseInt(row['DELEGADOS_TOTAL'] || '0');
        const rawMunicipio = row['MUNICIPIO']?.toString().trim() || 'NO PROCEDE';

        if (!rawProvincia || !rawSector || !rawOrgano || !rawUnidad || !rawAnio) {
          errores.push({ fila, motivo: 'Faltan campos obligatorios (PROVINCIA, SECTOR, TIPO_ORGANO, UNIDAD_ELECTORAL, AÑO).' });
          continue;
        }

        // ── 1. Resolver Provincia ──
        const provKey = normalize(rawProvincia);
        let provincia = provMap.get(provKey);
        if (!provincia) {
          errores.push({ fila, motivo: `Provincia no encontrada: "${rawProvincia}". Verifica el nombre exacto.` });
          continue;
        }

        // ── Restricción Autonómica: filtrar por CCAA ──
        if (userRole === 'super_autonomico' && userCcaaId) {
          if (String(provincia.ccaa_id) !== String(userCcaaId)) {
            errores.push({ fila, motivo: `Provincia fuera de tu ámbito autonómico: "${rawProvincia}".` });
            continue;
          }
        }

        const provinciaId = provincia.id;
        const ccaaId = provincia.ccaa_id;

        // ── 2. Resolver Sector (crear si no existe) ──
        const sectKey = normalize(rawSector);
        let sector = sectMap.get(sectKey);
        if (!sector) {
          const { data: newSect, error: sectErr } = await supabase
            .from('sectores').insert({ nombre: rawSector.toUpperCase() }).select().single();
          if (sectErr || !newSect) throw new Error(`Error creando sector "${rawSector}": ${sectErr?.message}`);
          sector = newSect;
          sectMap.set(sectKey, newSect);
        }

        // ── 3. Resolver Tipo de Órgano (crear si no existe) ──
        const orgKey = normalize(rawOrgano);
        let organo = orgMap.get(orgKey);
        if (!organo) {
          const { data: newOrg, error: orgErr } = await supabase
            .from('tipos_organos').insert({ nombre: rawOrgano.toUpperCase() }).select().single();
          if (orgErr || !newOrg) throw new Error(`Error creando tipo de órgano "${rawOrgano}": ${orgErr?.message}`);
          organo = newOrg;
          orgMap.set(orgKey, newOrg);
        }

        // ── 4. Detectar sindicatos en las columnas DELEGADOS_* ──
        const delegadosPorSindicato: { sindId: number; siglas: string; delegados: number }[] = [];

        for (const [key, val] of Object.entries(row)) {
          if (!key.startsWith('DELEGADOS_') || key === 'DELEGADOS_TOTAL') continue;
          const siglas = normalize(key.replace('DELEGADOS_', '').trim());
          if (!siglas) continue;
          const delegates = parseInt(String(val) || '0') || 0;
          if (delegates <= 0) continue;

          let sind = sindMap.get(siglas);
          if (!sind) {
            // Crear sindicato nuevo con ID secuencial
            const { data: newSind, error: sindErr } = await supabase
              .from('sindicatos')
              .insert({ id: nextSindId, siglas: siglas, nombre_completo: siglas, orden_prioridad: 50 })
              .select().single();
            if (sindErr || !newSind) throw new Error(`Error creando sindicato "${siglas}": ${sindErr?.message}`);
            sind = newSind;
            sindMap.set(siglas, newSind);
            nextSindId++;
          }
          delegadosPorSindicato.push({ sindId: sind!.id, siglas, delegados: delegates });
        }

        // ── 5. Upsert Unidad Electoral ──
        // Clave de unicidad: nombre + provincia_id + anio.
        // - Mismo órgano + misma provincia + mismo año = misma elección (idempotencia en reimportación).
        // - Mismo órgano + misma provincia + AÑO DISTINTO = elección diferente (se crea un registro nuevo).
        // - Mismo órgano + PROVINCIA DISTINTA = órgano diferente (se crea un registro nuevo).
        const { data: existingUnit } = await supabase
          .from('unidades_electorales')
          .select('id')
          .eq('nombre', rawUnidad.toUpperCase())
          .eq('provincia_id', provinciaId)
          .eq('anio', rawAnio)
          .maybeSingle();

        let unidadId: string;

        if (existingUnit) {
          // Ya existe esta combinación exacta: actualizar datos (idempotente).
          unidadId = existingUnit.id;
          await supabase.from('unidades_electorales')
            .update({ delegados_a_elegir: rawDelTotal, sector_id: sector!.id, tipo_organo_id: organo!.id })
            .eq('id', unidadId);
          actualizadas++;
        } else {
          // Nueva elección (nueva combinación nombre+provincia+año): crear registro.
          const { data: newUnit, error: unitErr } = await supabase
            .from('unidades_electorales')
            .insert({
              nombre: rawUnidad.toUpperCase(),
              provincia_id: provinciaId,
              ccaa_id: ccaaId,
              sector_id: sector!.id,
              tipo_organo_id: organo!.id,
              delegados_a_elegir: rawDelTotal,
              anio: rawAnio,
              estado: 'congelada',
              modo_colegio: 'unico',
            })
            .select('id')
            .single();
          if (unitErr) throw new Error(`Error creando unidad electoral: ${unitErr.message}`);
          unidadId = newUnit.id;
          importadas++;
        }



        // ── 6. Upsert Mesa Histórica (para el censo) ──
        const { data: existingMesa } = await supabase
          .from('mesas_electorales')
          .select('id')
          .eq('unidad_id', unidadId)
          .eq('nombre_identificador', 'IMPORTACIÓN HISTÓRICA')
          .maybeSingle();

        const mesaData = {
          unidad_id: unidadId,
          nombre_identificador: 'IMPORTACIÓN HISTÓRICA',
          censo_real: rawCenso,
          votos_blancos: 0,
          votos_nulos: 0,
          estado: 'enviada',
          fecha_envio: new Date().toISOString(),
        };

        if (existingMesa) {
          await supabase.from('mesas_electorales').update({ censo_real: rawCenso }).eq('id', existingMesa.id);
        } else {
          await supabase.from('mesas_electorales').insert(mesaData);
        }

        // ── 7. Upsert Resultados Consolidados por Sindicato ──
        if (delegadosPorSindicato.length > 0) {
          // Primero limpiar los resultados previos de esta unidad para que el upsert sea limpio
          if (existingUnit) {
            await supabase.from('resultados_consolidados').delete().eq('unidad_id', unidadId);
          }
          const consolidados = delegadosPorSindicato.map(d => ({
            unidad_id: unidadId,
            sindicato_id: d.sindId,
            votos_totales: 0,
            delegados_directos: d.delegados,
            delegados_por_restos: 0,
            delegados_totales: d.delegados,
            empate_pendiente: false,
          }));
          const { error: consErr } = await supabase.from('resultados_consolidados').insert(consolidados);
          if (consErr) throw new Error(`Error insertando resultados_consolidados: ${consErr.message}`);
        }

        // ── 8. Upsert Sindicatos relacionados con la unidad ──
        if (delegadosPorSindicato.length > 0) {
          if (existingUnit) {
            await supabase.from('unidades_sindicatos').delete().eq('unidad_id', unidadId);
          }
          await supabase.from('unidades_sindicatos').insert(
            delegadosPorSindicato.map(d => ({ unidad_id: unidadId, sindicato_id: d.sindId }))
          );
        }

      } catch (rowErr: any) {
        errores.push({ fila, motivo: rowErr.message });
      }
    }

    return NextResponse.json({ importadas, actualizadas, errores });

  } catch (err: any) {
    console.error('[importar-historico] Error general:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
