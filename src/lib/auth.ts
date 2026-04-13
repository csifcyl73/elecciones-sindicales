import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Obtiene el usuario autenticado desde las cookies de la request (server-side).
 * Retorna null si no hay sesión válida.
 */
export async function getAuthenticatedUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // No necesitamos setear cookies en la verificación de auth
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Verifica que el usuario esté autenticado y tenga uno de los roles permitidos.
 * Retorna { user, error } donde error es un NextResponse listo para devolver.
 */
export async function requireAuth(allowedRoles: string[]) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'No autenticado. Inicia sesión para continuar.' },
        { status: 401 }
      ),
    };
  }

  const role = user.user_metadata?.role;
  if (!allowedRoles.includes(role)) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'No autorizado. No tienes permisos para esta operación.' },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}
