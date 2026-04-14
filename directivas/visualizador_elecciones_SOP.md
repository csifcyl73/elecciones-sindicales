# SOP - Visualización de Elecciones (Pública y Autonómica)

## Objetivo
Configurar, depurar y asegurar el correcto funcionamiento del visualizador de procesos electorales, permitiendo el acceso público al escrutinio en vivo y el acceso privado por parte del Administrador Autonómico con reglas strictas de filtrado.

## Errores y Trampas Conocidas (Registro de Aprendizaje)

1. **Visibilidad Pública Rota debido a Middleware de Auth:** 
   - *El Problema:* Al consultar la página `/elecciones` (Home Pública), los procesos no se renderizaban. La página lanzaba peticiones `fetch` contra endpoints `/api/admin/...`, los cuales internamente verifican sesión mediante `requireAuth()`. Al no haber usuario, la API devolvía un array vacío o un error auth.
   - *La Solución:* **Nunca llamar a endpoints `/api/admin/` desde páginas públicas.** Se han creado endpoints paralelos en `/api/public/` (ej. `/api/public/unidades`, `/api/public/procesos-electorales` y `/api/public/visualizar/[id]`) estructurados para omitir `requireAuth()` pero seguir usando `getAdminSupabase()` para bypassear la restricción de RLS selectiva en componentes de solo lectura, sin exponer datos sensibles.

2. **Error `PGRST116` en Visualizador Autonómico:**
   - *El Problema:* El Administrador Autonómico abría el detalle de la elección y obtenía un error "Error cargando datos" crasheando el render. Estaba causado por el siguiente código frontend ciego: `await supabase.from('provincias').select('ccaa(nombre)').eq('id', d.unidad.provincia_id).single()`. Si `provincia_id` es `null` o no había respuesta, `.single()` falla catastróficamente.
   - *La Solución:* Evitar dobles cascadas (`fetch` interno desde un Effect) de validación en el cliente. Todo el contexto territorial (`ccaa(nombre)`, `provincias(nombre, ccaa(nombre))`) debe prepararse e inyectarse en el payload inicial desde la base de datos a través de `/api/admin/visualizar/[id]/route.ts`. Posteriormente el Frontend solo valida con la propiedad anidada resuelta.

## Casos Borde:
- **Protección de Identidades:** Los endpoints públicos como `/api/public/visualizar/[id]` JAMÁS deben cargar o exponer la información de Interventores (`usuarios(nombre_completo...`) asociados a las mesas.
- Si un Autonómico interactúa con sus paneles, la comprobación comunitaria (`unidadComunidad !== userComunidad`) ahora se realiza analizando la proyección de DB directa y evita problemas al intentar obtener provincias nacionales.
