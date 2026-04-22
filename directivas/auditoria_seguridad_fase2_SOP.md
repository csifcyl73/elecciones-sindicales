# Fase 2: Auditoría de Seguridad - SOP

## Objetivo
Implementar los controles de seguridad avanzados (Fase 2) en el proyecto de Elecciones Sindicales para la adecuación estricta al RGPD y LOPDGDD. Estas acciones consolidan la confidencialidad, integridad y disponibilidad del sistema alojado en Supabase (Frankfurt).

## Fases y Pasos

### 1. Refactorización de RLS (Row Level Security)
- **Problema:** Actualmente las políticas utilizan `USING(true)` con bypass desde la API mediante `service_role_key`. Esto delega demasiada confianza en la capa API de Next.js y no mitiga el impacto si la API es comprometida.
- **Solución:** Modificar las políticas de la base de datos Supabase para exigir autenticación real. (Se cambiará temporalmente en tablas críticas donde no interfiera masivamente con el middleware o se alertará del impacto).
- **Procedimiento:** Un script conectará al PostgreSQL de Supabase y actualizará las políticas.

### 2. Controles HTTP y Tipado en Next.js (Strict Checks & Security Headers)
- **Problema:** Faltan cabeceras de seguridad HTTP básicas, y el build de TypeScript/ESLint ignora los errores, relajando el control de calidad y seguridad del código.
- **Solución:**
  1. Modificar `next.config.ts` para inyectar cabeceras `Content-Security-Policy`, `X-DNS-Prefetch-Control`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
  2. Eliminar `ignoreBuildErrors` e `ignoreDuringBuilds` del `next.config.ts`.
- **Procedimiento:** Un script modificará por código los archivos de configuración para aplicar este endurecimiento.

### 3. Rate Limiting en APIs (Prevención DDoS / Fuerza Bruta)
- **Problema:** Las rutas API podrían sufrir de ataques de enumeración o intentos masivos de peticiones.
- **Solución:**
  Dado que no disponemos de un Redis preconfigurado (como Upstash), se implementará un Rate Limiter básico en memoria empleando un `Map` nativo de JavaScript para restringir los intentos por IP o sesión con un *bucket* en ventana deslizante en un entorno de instancia individual de Vercel (suficiente para entornos locales o como primera barrera de contención P2).
- **Procedimiento:** Se creará `src/lib/rate-limit.ts` y se inyectará en `src/middleware.ts` en caso factible.

### 4. Rotación de Credenciales
- **Problema:** Contraseñas de Base de Datos y de administradores débiles expuestas anteriormente.
- **Solución:** La rotación del password maestro de DB deberá hacerse manualmente desde el panel de Supabase y actualizar localmente el archivo `.env.local`. Por razones de seguridad, aquí documentaremos el proceso para que el super-administrador lo ejecute. Para los usuarios admin, el script puede cambiarles los passwords a valores robustos en la tabla `usuarios` (vía un script a ejecutar de un solo uso).

## Casos Borde y Trampas Conocidas (Actualización de Aprendizaje)
- **Nota Rate Limit Memory:** Un rate limiter en memoria (`Map`) se reinicia con cada despliegue de Vercel de las serverless functions y no es compartido por diferentes instancias o edge nodes. Es una barrera inicial; en el futuro (Fase 3) debe migrarse a `@upstash/ratelimit`.
- **Nota Next.Config.ts:** Next.js soporta cabeceras HTTP mediante el método asíncrono `headers()` exportado en el objeto de configuración. Redactarlo erróneamente quiebra el server (`next dev` no arranca).
- **Nota RLS auth.uid():** Las funciones anonimas del server no pueden usar `auth.uid()`. El RLS que exige autenticación rompera scripts cronizados a menos que tengan exclusión `service_role`.

## Ejecución
Los scripts de Python bajo `scripts/fase2_auditoria_*.py` automatizarán la aplicación de estos cambios.
