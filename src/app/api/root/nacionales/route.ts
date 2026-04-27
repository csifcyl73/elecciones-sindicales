import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fix #1 (ALTO): Usar getUser() en lugar de getSession() para verificación server-side segura
async function checkAdmin() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    // getUser() verifica el token contra el servidor de auth (seguro contra JWT manipulados)
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user || user.user_metadata?.role !== 'propietario_sistema') {
        return { error: 'No Autorizado' };
    }
    return { ok: true };
}

// Fix #3 (MEDIO): Schemas de validación Zod para inputs
const CreateNacionalSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombre: z.string().min(2).max(100),
});

const UpdatePasswordSchema = z.object({
  id: z.string().uuid('ID de usuario inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export async function GET() {
    const perm = await checkAdmin();
    if (perm.error) return NextResponse.json({ error: perm.error }, { status: 401 });

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    // Fix #2 (MEDIO): Error genérico al cliente, detalle solo en servidor
    if (error) {
        console.error('[nacionales GET] Supabase admin error:', error);
        return NextResponse.json({ error: 'Error al obtener usuarios.' }, { status: 500 });
    }
    
    const nacionales = data.users.filter(u => u.user_metadata?.role === 'super_nacional');
    return NextResponse.json({ users: nacionales });
}

export async function POST(request: NextRequest) {
    const perm = await checkAdmin();
    if (perm.error) return NextResponse.json({ error: perm.error }, { status: 401 });

    try {
        const body = await request.json();

        // Fix #3 (MEDIO): Validación Zod
        const parsed = CreateNacionalSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }
        const { email, password, nombre } = parsed.data;
        
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'super_nacional', name: nombre }
        });
        
        if (error) throw error;
        
        const { error: dbError } = await supabaseAdmin.from('usuarios').upsert({
            id: data.user.id,
            rol: 'super_nacional',
            email: email,
            nombre_completo: nombre
        });
        
        if (dbError) throw dbError;

        return NextResponse.json({ success: true, user: data.user });
    } catch(err: any) {
        // Fix #2 (MEDIO): Error genérico al cliente
        console.error('[nacionales POST] Error interno:', err);
        return NextResponse.json({ error: 'Error al crear el usuario.' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const perm = await checkAdmin();
    if (perm.error) return NextResponse.json({ error: perm.error }, { status: 401 });

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Se requiere el ID del usuario.' }, { status: 400 });
        
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (error) throw error;
        
        await supabaseAdmin.from('usuarios').delete().eq('id', id);
        
        return NextResponse.json({ success: true });
    } catch(err: any) {
        // Fix #2 (MEDIO): Error genérico al cliente
        console.error('[nacionales DELETE] Error interno:', err);
        return NextResponse.json({ error: 'Error al eliminar el usuario.' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const perm = await checkAdmin();
    if (perm.error) return NextResponse.json({ error: perm.error }, { status: 401 });

    try {
        const body = await request.json();

        // Fix #3 (MEDIO): Validación Zod
        const parsed = UpdatePasswordSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }
        const { id, password } = parsed.data;
        
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
        
        if (error) throw error;
        
        return NextResponse.json({ success: true, user: data.user });
    } catch(err: any) {
        // Fix #2 (MEDIO): Error genérico al cliente
        console.error('[nacionales PATCH] Error interno:', err);
        return NextResponse.json({ error: 'Error al actualizar la contraseña.' }, { status: 500 });
    }
}
