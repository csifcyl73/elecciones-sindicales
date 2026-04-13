import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: No usar getSession() — getUser() verifica con el servidor de auth
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // --- Proteger rutas de Admin Nacional ---
  // /admin/nacional/dashboard, /admin/nacional/alta-autonomico, etc.
  // NO proteger /admin/nacional (es la página de login)
  if (pathname.startsWith('/admin/nacional/')) {
    const subpath = pathname.replace('/admin/nacional/', '');
    if (subpath.length > 0) {
      if (!user || user.user_metadata?.role !== 'super_nacional') {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/nacional';
        return NextResponse.redirect(url);
      }
    }
  }

  // --- Proteger rutas de Admin Autonómico ---
  if (pathname.startsWith('/admin/autonomico/')) {
    const subpath = pathname.replace('/admin/autonomico/', '');
    if (subpath.length > 0) {
      if (!user || user.user_metadata?.role !== 'super_autonomico') {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/autonomico';
        return NextResponse.redirect(url);
      }
    }
  }

  // --- Proteger rutas de Interventor ---
  // /interventor/dashboard y /interventor/mesa/* 
  // NO proteger /interventor (es la página de login)
  if (pathname.startsWith('/interventor/dashboard') || pathname.startsWith('/interventor/mesa')) {
    if (!user || user.user_metadata?.role !== 'interventor') {
      const url = request.nextUrl.clone();
      url.pathname = '/interventor';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Rutas protegidas para admin y interventor
    '/admin/:path*',
    '/interventor/:path*',
  ],
};
