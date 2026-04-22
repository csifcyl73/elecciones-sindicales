# Fase 3: Auditoría de Seguridad - SOP (Nivel Producción / Zero Trust)

## Objetivo
Implementar aislamientos a nivel de base de datos para la tenencia de datos (aislamiento autonómico/geográfico) y garantizar la trazabilidad completa mediante Audit Logs, acercando al proyecto al cumplimiento normativo estricto y preparándolo para entornos de producción masiva.

## Fases y Pasos

### 1. Refactorización Granular de RLS (Zero Trust Geográfico)
- **Problema:** Un token de *super_autonomico* de 'Aragón' actualmente solo está bloqueado a nivel de front-end / API para no acceder a 'Cantabria'. A nivel de base de datos no hay barrera nativa.
- **Solución:** Implementar funciones y políticas Row Level Security (RLS) en `unidades_electorales` que crucen el JWT del usuario (`auth.jwt()->>'comunidad'`, asumiendo que custom claims existen, o uniéndolo a una consulta a la tabla `usuarios`) asegurando que los roles autonómicos solo puedan interactuar con unidades de su misma comunidad. Los `super_nacional` e `interventor` mantendrán acceso coherente a su rol.
- **Procedimiento:** Script generará el archivo SQL `supabase/fase3_rls_granular.sql` que el usuario ejecutará.

### 2. Trazabilidad (Audit Logs y Triggers en PostgreSQL)
- **Problema:** Si se modifica una unidad electoral o un resultado, perdemos el registro histórico de quién lo hizo y los valores anteriores, dificultando el análisis forense.
- **Solución:** 
  1. Crear una tabla `audit_logs` independiente y protegida.
  2. Implementar funciones Trigger en la base de datos que se activen en operaciones `INSERT`, `UPDATE` y `DELETE` en tablas críticas (ej: `unidades_electorales`).
  3. Los triggers deben capturar el ID del responsable usando `auth.uid()` o una variable local PostgreSQL configurada antes de la transacción en la API.
- **Procedimiento:** Script generará el archivo SQL `supabase/fase3_audit_triggers.sql`.

### 3. Migración a Edge Rate Limiting (Upstash / KV)
- **Problema:** El rate limit actual en memoria no se comparte entre peticiones *serverless* que son instanciadas de forma remota, siendo vulnerable a picos masivos de tráfico.
- **Solución:** Implementar `@upstash/ratelimit` en el middleware. Para no romper la aplicación del usuario sin las claves de Upstash, el script añadirá el paquete pero estructurará el código para caer a un fallo suave de vuelta al Rate Limit de memoria si las variables de entorno de Redis no existen.
- **Procedimiento:** 
  - Instalar `@upstash/ratelimit` y `@upstash/redis`.
  - Actualizar el `middleware.ts`.

## Restricciones y Aprendizaje (Trampas Conocidas)
- **NOTA Custom Claims en Supabase:** Si actualizamos metadatos como `comunidad` desde la app, éstos se reflejan en el JSON `raw_app_meta_data` o `raw_user_meta_data` en Supabase Auth. Para leerlos en RLS es necesario hacer llamadas seguras tipo `auth.jwt() -> 'user_metadata' ->> 'comunidad'`.
- **NOTA API Service Role y RLS:** La clave `service_role` de Supabase se salta **TODAS** las políticas RLS de forma nativa. Para aplicar el RLS granular es vital que las peticiones se hagan a partir del ID de usuario (token del cliente logueado o pasando explicitamente el contexto) o migrando progresivamente partes críticas fuera del service role. En esta fase documentaremos cómo el RLS nativo va de la mano con la reestructuración de la base de código.
- **NOTA Auth en Triggers:** Cuando el bypass temporal (service_role) está activo, `auth.uid()` será nulo. Debemos preparar las funciones de auditoría para aceptar `CURRENT_USER` y un fallback.

## Ejecución
Los scripts en `scripts/` relacionados con `fase3` se encargarán de materializar los SQLs e inyectar el nuevo middleware distribuido.
