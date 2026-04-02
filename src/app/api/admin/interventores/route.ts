import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Credenciales faltantes');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
};

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // Listar solo interventores
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;

    const interventores = users.filter((u: any) => u.user_metadata?.role === 'interventor');
    return NextResponse.json(interventores);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let { nombre, email, password, telefono, provincia_id } = await req.json();

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Nombre, Email y Contraseña son obligatorios.' }, { status: 400 });
    }

    email = email.trim().toLowerCase();

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Crear en Auth
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre: nombre.toUpperCase(),
        role: 'interventor',
        telefono
      }
    });

    if (authError) throw authError;

    // 2. Crear en public.usuarios (para RLS y relaciones)
    const { error: profileError } = await supabaseAdmin.from('usuarios').upsert({
      id: data.user.id,
      email: email,
      nombre_completo: nombre.toUpperCase(),
      rol: 'interventor',
      telefono: telefono
    });

    if (profileError) throw profileError;

    return NextResponse.json(data.user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    const supabaseAdmin = getSupabaseAdmin();
    
    await supabaseAdmin.from('usuarios').delete().eq('id', id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    let { id, nombre, email, password, telefono } = await req.json();

    if (!id || !nombre || !email) {
      return NextResponse.json({ error: 'ID, Nombre y Email son obligatorios.' }, { status: 400 });
    }

    email = email.trim().toLowerCase();

    const supabaseAdmin = getSupabaseAdmin();

    const attrsToUpdate: any = {
      email,
      email_confirm: true,
      user_metadata: {
        nombre: nombre.toUpperCase(),
        role: 'interventor',
        telefono
      }
    };
    if (password) {
       attrsToUpdate.password = password;
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, attrsToUpdate);
    if (authError) throw authError;

    const { error: profileError } = await supabaseAdmin.from('usuarios').update({
      email: email,
      nombre_completo: nombre.toUpperCase(),
      telefono: telefono
    }).eq('id', id);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, user: authData.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
