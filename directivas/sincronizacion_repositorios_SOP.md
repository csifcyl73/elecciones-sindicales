# SOP - Sincronización de Repositorios (GitHub, Supabase y Vercel)

## Objetivo
Asegurar que las modificaciones locales en el sistema de elecciones se reflejen correctamente tanto en el repositorio de código como en el motor de base de datos de producción.

## Log de Aprendizaje (Trampas Conocidas)

### 1. Variables de Entorno en Build (Vercel)
*   **Error observado:** `Error: supabaseKey is required.` durante el paso de "Collect page data" en Vercel. 
*   **Causa:** Next.js intenta instanciar módulos que llaman a `createClient` de Supabase al pre-renderizar rutas. Si las variables de entorno aún no están inyectadas en la fase de build, el cliente falla.
*   **Restricción:** No instanciar el cliente de Supabase (especialmente el `admin` con `SERVICE_ROLE_KEY`) a nivel raíz de un archivo de API.
*   **Solución:** Usar **Lazy Loading**. Crear una función `getSupabaseAdmin()` que instancie el cliente solo cuando se invoca la función handler (POST, GET, etc.).

### 2. Conectividad con la Base de Datos (Supabase IPv6)
*   **Error observado:** `ENETUNREACH` al intentar conectar vía `postgresql://` desde el servidor del Agente.
*   **Causa:** Supabase asigna hosts de base de datos (`db.xxx.supabase.co`) que en ciertas regiones son **exclusivamente IPv6**. Los servidores que solo admiten salida IPv4 (como este entorno de desarrollo) no pueden resolver o alcanzar ese host directamente.
*   **Restricción:** No intentar aplicar migraciones SQL pesadas desde este entorno mediante el puerto 5432.
*   **Solución:** Documentar el Schema en `supabase/migrations/` y pedir al usuario que lo ejecute en el **SQL Editor** de Supabase como fallback de alta fiabilidad. Próximamente investigar el uso de Supabase Pooler (IPv4).

## Pasos para Sincronización Exitosa

1.  **Código:**
    - Realizar cambios y verificar `npm run build` localmente.
    - Asegurar que `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` estén en los Settings de Vercel (Producción).
    - `git push origin master`.
2.  **Base de Datos:**
    - Si hay cambios en `src/lib/types/database.ts`, actualizar el archivo SQL en `supabase/migrations/`.
    - Ejecutar el SQL en el dashboard remoto de Supabase.

## Verificación
- Visitar `https://elecciones-sindicales.vercel.app/` y confirmar el cambio visual (Sidebar y Título).
- Probar un login de Administrador Nacional.
