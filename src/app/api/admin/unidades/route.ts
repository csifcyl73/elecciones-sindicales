import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const getAdmin = () => createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder')
);

export async function GET() {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const supabase = getAdmin();
    const { data, error } = await supabase
      .from('unidades_electorales')
      .select(`
        *,
        ccaa(nombre),
        provincias(nombre),
        sectores(nombre),
        tipos_organos(nombre),
        mesas_electorales(
          *,
          usuarios(nombre_completo)
        )
      `)
      .order('nombre', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const supabase = getAdmin();
    const { id } = await req.json();

    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    const { error } = await supabase
      .from('unidades_electorales')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const supabase = getAdmin();
    const { nombre } = await req.json();

    if (!nombre) return NextResponse.json({ error: 'Falta nombre' }, { status: 400 });

    const { data, error } = await supabase
      .from('unidades_electorales')
      .insert({ nombre: nombre.toUpperCase() })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
