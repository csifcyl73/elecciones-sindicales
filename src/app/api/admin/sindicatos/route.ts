import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('sindicatos').select('*').order('siglas');
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const { siglas, nombre_completo, es_federacion, federacion_id } = body;

    if (!siglas || !nombre_completo) {
      return NextResponse.json({ error: 'Siglas y nombre son obligatorios' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const siglasUpper = siglas.toUpperCase();

    // Check if sindicato with these siglas already exists to prevent sindicatos_siglas_key error
    const { data: existing } = await supabase
      .from('sindicatos')
      .select('*')
      .eq('siglas', siglasUpper)
      .maybeSingle();

    if (existing) {
      // If it exists, gracefully return the existing one so the frontend proceeds without error
      return NextResponse.json(existing);
    }

    // Fix for duplicate key value violates unique constraint "sindicatos_pkey"
    // Fetch max ID to manually assign the next one 
    const { data: maxRecord } = await supabase
      .from('sindicatos')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const nextId = (maxRecord?.id || 0) + 1;

    const { data, error } = await supabase
      .from('sindicatos')
      .insert([{
        id: nextId,
        siglas: siglas.toUpperCase(),
        nombre_completo: nombre_completo.toUpperCase(),
        es_federacion: es_federacion || false,
        federacion_id: federacion_id || null,
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

export async function PATCH(request: Request) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const { id, siglas, nombre_completo, es_federacion, federacion_id } = body;
    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('sindicatos')
      .update({
        siglas: siglas?.toUpperCase(),
        nombre_completo: nombre_completo?.toUpperCase(),
        es_federacion,
        federacion_id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('sindicatos').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
