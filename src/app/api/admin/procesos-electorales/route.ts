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
      .from('procesos_electorales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const supabase = getAdmin();
    const body = await req.json();

    const { data, error } = await supabase
      .from('procesos_electorales')
      .insert({
        nombre: body.nombre,
        periodo: body.periodo || null,
        observaciones: body.observaciones || null
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const supabase = getAdmin();
    const body = await req.json();

    const { data, error } = await supabase
      .from('procesos_electorales')
      .update({
        nombre: body.nombre,
        periodo: body.periodo || null,
        observaciones: body.observaciones || null
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const supabase = getAdmin();
    const body = await req.json();

    // Desvincular unidades primero
    await supabase
      .from('unidades_electorales')
      .update({ proceso_electoral_id: null })
      .eq('proceso_electoral_id', body.id);

    const { error } = await supabase
      .from('procesos_electorales')
      .delete()
      .eq('id', body.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
