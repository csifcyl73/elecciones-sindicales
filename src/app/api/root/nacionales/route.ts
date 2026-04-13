import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAdmin(request: NextRequest) {
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
              cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
              cookieStore.delete({ name, ...options })
          },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.user_metadata?.role !== 'propietario_sistema') {
        return { error: 'No Autorizado' };
    }
    return { ok: true };
}

export async function GET(request: NextRequest) {
    const perm = await checkAdmin(request);
    if (perm.error) return NextResponse.json({ error: perm.error }, { status: 401 });

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    const nacionales = data.users.filter(u => u.user_metadata?.role === 'super_nacional');
    return NextResponse.json({ users: nacionales });
}

export async function POST(request: NextRequest) {
    const perm = await checkAdmin(request);
    if (perm.error) return NextResponse.json({ error: perm.error }, { status: 401 });

    try {
        const body = await request.json();
        const { email, password, nombre } = body;
        
        // 1. Create Auth user
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'super_nacional', name: nombre }
        });
        
        if (error) throw error;
        
        // 2. Add to public.usuarios via Supabase Admin OR just rely on Auth user_metadata
        // Ya que la BD requiere en public.usuarios, vamos a insertarlo:
        const { error: dbError } = await supabaseAdmin.from('usuarios').upsert({
            id: data.user.id,
            rol: 'super_nacional',
            email: email,
            nombre_completo: nombre
        });
        
        if (dbError) throw dbError;

        return NextResponse.json({ success: true, user: data.user });
    } catch(err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const perm = await checkAdmin(request);
    if (perm.error) return NextResponse.json({ error: perm.error }, { status: 401 });

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) throw new Error('Se requiere el ID del usuario');
        
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (error) throw error;
        
        // También borrarlo de public.usuarios para limpiar
        await supabaseAdmin.from('usuarios').delete().eq('id', id);
        
        return NextResponse.json({ success: true });
    } catch(err: any) {
         return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
