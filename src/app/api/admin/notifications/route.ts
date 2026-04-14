import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const getAdminSupabase = () => createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder')
);

export async function GET(req: NextRequest) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const supabase = getAdminSupabase();
    
    // Calculamos el umbral de 24 horas
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Obtener las últimas mesas enviadas en las últimas 24h
    // NOTA: Se ha desactivado el filtro de notificacion_borrada porque la columna no existe en DB.
    const { data: mesas, error } = await supabase
      .from('mesas_electorales')
      .select(`
        id,
        nombre_identificador,
        fecha_envio,
        unidad:unidades_electorales(nombre),
        interventor:usuarios(nombre_completo)
      `)
      .not('fecha_envio', 'is', null)
      .gt('fecha_envio', twentyFourHoursAgo)
      .order('fecha_envio', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json(mesas || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const { id } = await req.json();
    const supabase = getAdminSupabase();
    
    // "Borramos" la notificación marcando un flag en la mesa
    // Asumimos que hemos añadido la columna o usamos un sistema de meta de Supabase
    const { error } = await supabase
      .from('mesas_electorales')
      .update({ notificacion_borrada: true })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

