import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder')
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) return NextResponse.json({ error: 'Falta ID de usuario' }, { status: 400 });

    const { data, error } = await supabaseAdmin
       .from('mesas_electorales')
       .select(`
          id,
          nombre_identificador,
          estado,
          unidades_electorales (
             nombre,
             estado,
             tipo_organo_id,
             delegados_a_elegir,
             provincias (nombre)
          )
       `)
       .eq('interventor_id', userId);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("Mis mesas API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
