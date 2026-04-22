// Rate Limiter simple en memoria (Fase 2 Auditoría)
// --------------------------------------------------------------------------------
// FASE 3: Edge Rate Limiting Distribuido (@upstash/ratelimit) - FALLBACK EN MEMORIA
// --------------------------------------------------------------------------------
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Instanciar limitador (con fallback condicional por si no hay env vars configuradas en entorno local)
let ratelimit: Ratelimit | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, "60 s"),
      analytics: true,
      prefix: "@upstash/ratelimit",
    });
  }
} catch (e) {
  console.warn("Upstash RateLimit inactivo: Faltan variables de entorno.");
}

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 100; // max requests per minute
const WINDOW_MS = 60000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }
  if (now - record.lastReset > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  record.count++;
  return true;
}

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Fase 2 - Rate Limiting
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  if (request.nextUrl.pathname.startsWith('/api/') || request.nextUrl.pathname.startsWith('/admin/')) {
    // Fase 3 - Comprobación Edge (Fallback silencioso a memo)
    if (ratelimit) {
      const { success } = await ratelimit.limit(ip);
      if (!success) return new NextResponse('Too Many Requests', { status: 429 });
    } else {
      if (!checkRateLimit(ip)) {
        return new NextResponse('Too Many Requests Locally', { status: 429 });
      }
    }
  }

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
