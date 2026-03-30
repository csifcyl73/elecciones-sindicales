import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Admin (Saltando RLS)
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) throw new Error('Credenciales faltantes');
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { siglas, nombre_completo } = body;

    if (!siglas || !nombre_completo) {
      return NextResponse.json({ error: 'Siglas y nombre son obligatorios' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('sindicatos')
      .insert([{
        siglas: siglas.toUpperCase(),
        nombre_completo: nombre_completo.toUpperCase(),
        orden_prioridad: 50 // Prioridad estándar para nuevos
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
