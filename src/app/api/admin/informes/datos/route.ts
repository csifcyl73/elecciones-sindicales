import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/admin/informes/datos?ids=uuid1,uuid2,...
 *
 * Recibe IDs de unidades_electorales (no de procesos).
 * Devuelve datos agregados por unidad: resultados_consolidados + metadatos.
 */
export async function GET(req: NextRequest) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');
    if (!idsParam) return NextResponse.json({ error: 'Falta ids' }, { status: 400 });

    const unidadIds = idsParam.split(',').filter(Boolean);
    if (unidadIds.length === 0) return NextResponse.json([]);

    const supabase = getSupabaseAdmin();

    // Obtener metadatos de las unidades seleccionadas + resultados en paralelo
    const [unidadesRes, consolidadosRes] = await Promise.all([
      supabase
        .from('unidades_electorales')
        .select(`
          id, nombre, anio, delegados_a_elegir, estado, modo_colegio,
          provincias(nombre),
          sectores(nombre),
          tipos_organos(nombre),
          ccaa(nombre)
        `)
        .in('id', unidadIds),
      supabase
        .from('resultados_consolidados')
        .select('unidad_id, sindicato_id, delegados_totales, delegados_directos, sindicatos(siglas, nombre_completo)')
        .in('unidad_id', unidadIds),
    ]);

    if (unidadesRes.error) throw unidadesRes.error;
    if (consolidadosRes.error) throw consolidadosRes.error;

    const unidades = unidadesRes.data || [];
    const consolidados = consolidadosRes.data || [];

    // Para cada unidad, agregar delegados por sindicato
    const resultado = unidades.map((u: any) => {
      const consolidadosDeEstaUnidad = consolidados.filter((c: any) => c.unidad_id === u.id);

      const porSindicato: Record<string, { siglas: string; nombre: string; delegados: number }> = {};
      consolidadosDeEstaUnidad.forEach((c: any) => {
        const key = String(c.sindicato_id);
        if (!porSindicato[key]) {
          porSindicato[key] = {
            siglas: c.sindicatos?.siglas || 'N/A',
            nombre: c.sindicatos?.nombre_completo || 'Desconocido',
            delegados: 0,
          };
        }
        // Usa delegados_totales (importaciones hist.) o delegados_directos como fallback
        const delegados = c.delegados_totales ?? c.delegados_directos ?? 0;
        porSindicato[key].delegados += delegados;
      });

      const sindicatosArray = Object.values(porSindicato).sort((a, b) => b.delegados - a.delegados);
      const totalDelegadosObtenidos = sindicatosArray.reduce((s, x) => s + x.delegados, 0);

      return {
        id: u.id,
        nombre: u.nombre,
        anio: u.anio,
        estado: u.estado,
        delegadosAElegir: u.delegados_a_elegir || 0,
        totalDelegadosObtenidos,
        provincia: u.provincias?.nombre || null,
        sector: u.sectores?.nombre || null,
        tipoOrgano: u.tipos_organos?.nombre || null,
        ccaa: u.ccaa?.nombre || null,
        sindicatos: sindicatosArray,
      };
    });

    // Mantener el orden de selección del usuario
    const ordenado = unidadIds
      .map(id => resultado.find(r => r.id === id))
      .filter(Boolean);

    return NextResponse.json(ordenado);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
