# Auditoría de Seguridad - SOP

## Objetivo
Identificar y remediar vulnerabilidades de seguridad en las APIs, autenticación y configuración de la base de datos del proyecto de Elecciones Sindicales.

## Estado: FASE 1 COMPLETADA ✅

### Correcciones P0 Aplicadas (12/04/2026)

| # | Vulnerabilidad | Estado | Cambio |
|---|---|---|---|
| 1 | APIs sin autenticación | ✅ CORREGIDO | `requireAuth()` añadido a TODAS las rutas API |
| 2 | Sin middleware de protección | ✅ CORREGIDO | `src/middleware.ts` creado con verificación de sesión y rol |
| 3 | Contraseña BD hardcodeada | ✅ CORREGIDO | Movida a `DATABASE_URL` en `.env.local` |
| 4 | Backdoor fix-rls | ✅ ELIMINADO | Directorio `/api/admin/fix-rls` eliminado |
| 5 | Credenciales en scripts | ✅ CORREGIDO | Scripts usan `process.env.DATABASE_URL` |
| 6 | Cron sin auth | ✅ CORREGIDO | Protegido con `CRON_SECRET` |
| 7 | Login admin usa localStorage | ✅ CORREGIDO | Migrado a SSR client (`@/lib/supabase/client`) |
| 8 | Contraseña en .env comentario | ✅ CORREGIDO | Comentario eliminado |

### Archivos Creados
- `src/lib/auth.ts` — Utilidad centralizada de autenticación para API routes
- `src/middleware.ts` — Middleware de Next.js para protección de rutas

### Archivos Modificados (Resumen)
- **6 páginas de admin** — Migradas de `@supabase/supabase-js` a `@/lib/supabase/client` (SSR con cookies)
- **16 API routes** — Añadido `requireAuth()` con roles apropiados
- **3 scripts** — Credenciales movidas a variable de entorno `DATABASE_URL`
- **1 ruta eliminada** — `/api/admin/fix-rls` (backdoor)

### Restricciones / Casos Borde Descubiertos
- **NOTA:** Las páginas `client-side` (`"use client"`) que usaban `createClient` de `@supabase/supabase-js` almacenaban la sesión en localStorage, invisible al middleware. Se DEBEN usar `createClient` de `@/lib/supabase/client` (SSR) para que la sesión se almacene en cookies.
- **NOTA:** El cron de Vercel requiere la variable `CRON_SECRET` configurada en el dashboard de Vercel. Sin ella, el endpoint devuelve 401.
- **NOTA:** Los API routes siguen usando `service_role_key` para las operaciones de BD (bypass RLS). Esto es necesario mientras las políticas RLS estén configuradas como `USING(true)`. La corrección de RLS es la Fase 2.

## Pendiente - Fase 2 (Requiere Autorización)
- [ ] Rotación de contraseña de BD (la anterior estuvo expuesta en el código)
- [ ] Rotación de contraseñas de admins (Admin1234, Test1234!, admin)
- [ ] Refactorización de RLS (reemplazar `USING(true)` por políticas con `auth.uid()`)
- [ ] Rate limiting en APIs
- [ ] Headers HTTP de seguridad (CSP, HSTS, X-Frame-Options)
- [ ] Reactivar TypeScript strict checks en build

## Lógica de Verificación de Auth
1. El middleware (`src/middleware.ts`) intercepta TODAS las rutas bajo `/admin/*` y `/interventor/*`
2. Las páginas de login (`/admin/nacional`, `/admin/autonomico`, `/interventor`) NO están protegidas
3. Las sub-rutas (ej: `/admin/nacional/dashboard`) requieren sesión válida + rol correcto → si no, redirect al login
4. Las API routes validan la sesión desde cookies usando `requireAuth()` de `src/lib/auth.ts`
5. Los roles permitidos por ruta:
   - Admin nacional: `super_nacional`
   - Admin autonómico: `super_autonomico`
   - Interventor: `interventor`
   - APIs admin: `super_nacional` + `super_autonomico`
   - APIs interventor: `interventor` (+ admins para el proxy de mesa)
   - Cron: `CRON_SECRET` (sin sesión de usuario)
