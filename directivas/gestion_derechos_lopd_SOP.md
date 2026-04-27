# SOP - Gestión de Derechos LOPD para Interventores

## Objetivo
Implementar un sistema automatizado para que los usuarios con rol de `interventor` puedan ejercer sus derechos LOPD/RGPD (específicamente el Derecho de Supresión o "Baja Definitiva") directamente desde su panel de control.

## Estructura de Datos (Lista de Supresión)
Para garantizar que un interventor dado de baja no vuelva a ser importado en el futuro (ej. en volcados de datos desde Excel), se debe mantener un listado independiente.

**Tabla:** `lopd_bajas`
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE)
- `nombre_completo` (TEXT)
- `fecha_solicitud` (TIMESTAMPTZ)
- `procesado` (BOOLEAN)

*Importante: Esta tabla actúa como una "lista negra" o "lista de Robinson" interna. Cualquier importación futura deberá cruzar los datos contra esta tabla y omitir la creación de usuarios cuyos emails consten aquí.*

## Protocolo de Ejecución

1. **Interfaz de Usuario:**
   - En los Dashboards (`src/app/interventor/dashboard/page.tsx`, `src/app/admin/nacional/dashboard/page.tsx` y `src/app/admin/autonomico/dashboard/page.tsx`), se añade un botón de "Privacidad (LOPD)".
   - La página correspondiente (`/privacidad`) debe informar de forma clara e inequívoca las consecuencias de la baja (pérdida de acceso, desvinculación de mesas en caso de interventores, pérdida de gestión en caso de admins).
   
2. **Procesamiento de la Solicitud (`/api/lopd/baja`):**
   - Validar la sesión del usuario (interventor, super_nacional o super_autonomico).
   - Insertar el registro (`email`, `nombre_completo`) en la tabla `lopd_bajas`.
   - Utilizar el cliente de Supabase con permisos de administrador (`SUPABASE_SERVICE_ROLE_KEY`) para eliminar al usuario de `auth.users`.
   - Por integridad referencial (`ON DELETE CASCADE` y `ON DELETE SET NULL`), el usuario desaparecerá de `public.usuarios` y su asignación a las `mesas_electorales` quedará nula (liberando la mesa).
   
3. **Cruce en Futuras Recuperaciones (Regla a mantener):**
   - **Restricción:** Antes de insertar nuevos interventores procedentes de backups o Excels, el sistema SIEMPRE debe hacer un `LEFT JOIN` o comprobación contra `lopd_bajas` y excluir las coincidencias.

## Casos Borde y Trampas Conocidas
- **Error Unique Violation:** Si un usuario ya había solicitado la baja previamente y por alguna razón (re-importación accidental antes de aplicar la regla) se le vuelve a crear la cuenta y pide baja de nuevo, el sistema debe ignorar el error `23505` (Unique) al intentar registrar su email en `lopd_bajas` y proceder directamente a borrar su usuario de `auth.users`.
- **Ejecución de Migración:** La tabla `lopd_bajas` debe crearse en la base de datos de producción mediante `supabase/migrations/20260427160000_lopd_bajas.sql`. Si la conexión directa a DB falla, ejecutar el SQL manualmente en el SQL Editor del panel de control de Supabase.
