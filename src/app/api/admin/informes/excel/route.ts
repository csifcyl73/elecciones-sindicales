import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');
    if (!idsParam) return NextResponse.json({ error: 'Falta ids' }, { status: 400 });

    const unidadIds = idsParam.split(',').filter(Boolean);
    const supabase = getSupabaseAdmin();

    const [unidadesRes, consolidadosRes] = await Promise.all([
      supabase
        .from('unidades_electorales')
        .select(`
          id, nombre, anio, delegados_a_elegir, estado,
          provincias(nombre), sectores(nombre), tipos_organos(nombre)
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

    // Calcular datos por unidad
    const dataPorUnidad = unidades.map((u: any) => {
      const cons = consolidados.filter((c: any) => c.unidad_id === u.id);
      const porSindicato: Record<string, { siglas: string; nombre: string; delegados: number }> = {};
      cons.forEach((c: any) => {
        const key = String(c.sindicato_id);
        if (!porSindicato[key]) {
          porSindicato[key] = {
            siglas: c.sindicatos?.siglas || 'N/A',
            nombre: c.sindicatos?.nombre_completo || 'Desconocido',
            delegados: 0,
          };
        }
        const delegados = c.delegados_totales ?? c.delegados_directos ?? 0;
        porSindicato[key].delegados += delegados;
      });
      const sindicatos = Object.values(porSindicato).sort((a, b) => b.delegados - a.delegados);
      return {
        unidad: u,
        sindicatos,
        totalObtenidos: sindicatos.reduce((s, x) => s + x.delegados, 0),
      };
    });

    const wb = XLSX.utils.book_new();

    // ── HOJA 1: Resumen ──────────────────────────────────────────────────
    const resumenRows: any[][] = [
      ['INFORME COMPARATIVO — ELECCIONES SINDICALES'],
      [`Generado: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`],
      [],
      ['Elección', 'Año', 'Provincia', 'Sector', 'Tipo Órgano', 'Delegados a Elegir', 'Delegados Obtenidos'],
    ];

    dataPorUnidad.forEach(({ unidad: u, totalObtenidos }) => {
      resumenRows.push([
        u.nombre,
        u.anio,
        u.provincias?.nombre || '—',
        u.sectores?.nombre || '—',
        u.tipos_organos?.nombre || '—',
        u.delegados_a_elegir || 0,
        totalObtenidos,
      ]);
    });

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);
    wsResumen['!cols'] = [{ wch: 50 }, { wch: 8 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 22 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // ── HOJA 2: Tabla Cruzada Sindicatos × Elecciones ────────────────────
    const todosLosSindicatos = new Map<string, string>();
    dataPorUnidad.forEach(({ sindicatos }) => {
      sindicatos.forEach(s => {
        if (!todosLosSindicatos.has(s.siglas)) todosLosSindicatos.set(s.siglas, s.nombre);
      });
    });

    const cruzadaHeader = [
      'Sindicato',
      'Nombre Completo',
      ...dataPorUnidad.map(({ unidad: u }) => `${u.nombre} (${u.anio})`),
    ];
    const cruzadaRows: any[][] = [cruzadaHeader];

    todosLosSindicatos.forEach((nombre, siglas) => {
      const row: any[] = [siglas, nombre];
      dataPorUnidad.forEach(({ sindicatos }) => {
        const found = sindicatos.find(s => s.siglas === siglas);
        row.push(found ? found.delegados : 0);
      });
      cruzadaRows.push(row);
    });

    const wsCruzada = XLSX.utils.aoa_to_sheet(cruzadaRows);
    wsCruzada['!cols'] = [{ wch: 14 }, { wch: 40 }, ...dataPorUnidad.map(() => ({ wch: 35 }))];
    XLSX.utils.book_append_sheet(wb, wsCruzada, 'Por Sindicato');

    // ── HOJAS por elección ────────────────────────────────────────────────
    dataPorUnidad.forEach(({ unidad: u, sindicatos, totalObtenidos }) => {
      const detalleRows: any[][] = [
        [`Elección: ${u.nombre}`],
        [`Año: ${u.anio} | Provincia: ${u.provincias?.nombre || '—'} | Sector: ${u.sectores?.nombre || '—'}`],
        [],
        ['Sindicato', 'Nombre Completo', 'Delegados Obtenidos', '% Representación'],
      ];
      sindicatos.forEach(s => {
        detalleRows.push([
          s.siglas,
          s.nombre,
          s.delegados,
          totalObtenidos > 0 ? `${((s.delegados / totalObtenidos) * 100).toFixed(2)}%` : '0%',
        ]);
      });
      detalleRows.push([], ['TOTAL', '', totalObtenidos, '100%']);

      const ws = XLSX.utils.aoa_to_sheet(detalleRows);
      ws['!cols'] = [{ wch: 14 }, { wch: 40 }, { wch: 22 }, { wch: 20 }];
      const sheetName = `${u.anio}_${u.nombre}`.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const fecha = new Date().toISOString().slice(0, 10);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="informe_comparativo_${fecha}.xlsx"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
