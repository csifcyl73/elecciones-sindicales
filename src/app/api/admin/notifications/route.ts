import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const getAdminSupabase = () => createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder')
);

export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminSupabase();
    
    // Obtener las últimas 5 mesas enviadas
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
      .order('fecha_envio', { ascending: false })
      .limit(5);

    if (error) throw error;

    return NextResponse.json(mesas || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
