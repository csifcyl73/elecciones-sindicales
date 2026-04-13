import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Credenciales faltantes');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
};

export async function GET() {
  const { error: authError } = await requireAuth(['super_nacional']);
  if (authError) return authError;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    // Listar usuarios (por defecto trae máximo 1000)
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;

    // Filtrar solo administradores autonómicos
    const admins = users.filter((u: any) => u.user_metadata?.role === 'super_autonomico');
    
    return NextResponse.json(admins);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { error: authError } = await requireAuth(['super_nacional']);
  if (authError) return authError;

  try {
    const { id, nombre, apellidos, comunidad, email } = await req.json();
    if (!id) return NextResponse.json({ error: 'Falta ID de usuario' }, { status: 400 });

    const supabaseAdmin = getSupabaseAdmin();

    // Actualizamos usuario (Auth)
    const updateData: any = {
      user_metadata: {
        nombre: nombre?.toUpperCase(),
        apellidos: apellidos?.toUpperCase(),
        comunidad: comunidad?.toUpperCase(),
        role: 'super_autonomico'
      }
    };

    if (email) updateData.email = email;

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);
    if (error) throw error;

    return NextResponse.json(data.user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { error: authError } = await requireAuth(['super_nacional']);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
