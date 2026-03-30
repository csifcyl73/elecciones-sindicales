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

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('unidades_electorales').select('*').order('nombre');
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, provincia_id, sector_id } = body;
    if (!nombre) return NextResponse.json({ error: 'Falta nombre' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('unidades_electorales').insert([{
      nombre: nombre.toUpperCase(),
      provincia_id: provincia_id ? parseInt(provincia_id) : null,
      sector_id: sector_id ? parseInt(sector_id) : null,
      estado: 'configuracion'
    }]).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('unidades_electorales').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
