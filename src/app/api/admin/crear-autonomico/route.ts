import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

// Crear el cliente de administración solo cuando se necesita
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase URL or Service Role Key is missing');
  }
  
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
};

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth(['super_nacional']);
  if (authError) return authError;

  try {
    const { nombre, apellidos, comunidad, usuario, password } = await req.json();

    // Validaciones básicas
    if (!nombre || !apellidos || !comunidad || !usuario || !password) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Crear usuario en Supabase con email confirmado
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: usuario,
      password,
      email_confirm: true,
      user_metadata: {
        nombre: nombre.toUpperCase(),
        apellidos: apellidos.toUpperCase(),
        comunidad: comunidad.toUpperCase(),
        role: 'super_autonomico',
      },
    });

    if (error) {
      if (error.message.includes('already been registered') || error.message.includes('already exists')) {
        return NextResponse.json({ error: 'Este usuario ya existe en el sistema.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      id: data.user.id,
      email: data.user.email,
    });
  } catch (err) {
    console.error('Error creating autonomic admin:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
