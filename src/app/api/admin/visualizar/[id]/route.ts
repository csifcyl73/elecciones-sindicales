import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const getAdminSupabase = () => createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder')
);

export async function GET(req: NextRequest, context: any) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const { id } = await context.params;
    const supabase = getAdminSupabase();
    
    // Obtener unidad completa
    const { data: unidad, error: unidadError } = await supabase
      .from('unidades_electorales')
      .select(`
        *,
        ccaa(nombre),
        provincias(nombre, ccaa(nombre)),
        sectores(nombre),
        proceso:procesos_electorales(nombre)
      `)
      .eq('id', id)
      .single();

    if (unidadError) throw unidadError;

    // Obtener mesas con info de interventor
    const { data: mesas, error: mesasError } = await supabase
      .from('mesas_electorales')
      .select(`
        *,
        interventor:usuarios(nombre_completo, email, telefono)
      `)
      .eq('unidad_id', id);
      
    if (mesasError) throw mesasError;

    // Obtener votos
    let votos: any[] = [];
    if (mesas && mesas.length > 0) {
      const { data, error } = await supabase
        .from('votos_candidaturas')
        .select(`
          *,
          sindicatos(siglas)
        `)
        .in('mesa_id', mesas.map(m => m.id));
        
      if (error) throw error;
      votos = data || [];
    }

    // Resultados consolidados (Reparto Ley D'Hondt) guardados
    const { data: consolidadosRaw, error: consolidadosError } = await supabase
      .from('resultados_consolidados')
      .select('*, sindicatos(siglas)')
      .eq('unidad_id', id);

    // Normalizar: añadir el campo detalle_reparto que espera el frontend para el tooltip
    const consolidados = (consolidadosRaw || []).map((c: any) => ({
      ...c,
      detalle_reparto: {
        directos: c.delegados_directos ?? 0,
        restos: c.delegados_por_restos ?? 0,
      }
    }));

    if (consolidadosError) throw consolidadosError;

    return NextResponse.json({
      unidad,
      mesas,
      votos,
      consolidados
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: any) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
     const { id } = await context.params;
     const supabase = getAdminSupabase();
     // Bloquear la elección
     const { error } = await supabase
        .from('unidades_electorales')
        .update({ estado: 'congelada' })
        .eq('id', id);

     if (error) throw error;
     return NextResponse.json({ success: true });
  } catch (err: any) {
     return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
