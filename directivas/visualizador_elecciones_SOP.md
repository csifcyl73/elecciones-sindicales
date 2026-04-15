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

3. **Error de Build "Expected ',', got '{'" (Nesting TSX):**
   - *El Problema:* El archivo `src/app/admin/autonomico/visualizar/page.tsx` fallaba al compilar debido a múltiples cierres `</div>` accidentales (líneas 282 y 531) que terminaban el root element antes de tiempo. Esto causaba que el compilador encontrara bloques JSX sueltos fuera del retorno principal.
   - *La Solución:* Mantener una vigilancia estricta sobre la jerarquía de divs. Todo el contenido dinámico, filtros y modales deben estar contenidos dentro del wrapper de margen (`max-w-7xl`) y del root div. Se ha corregido eliminando cierres redundantes y verificando el balance de etiquetas al final del archivo.

4. **Discrepancia de Roles en Scripts de Prueba:**
   - *El Problema:* Los scripts `create-test-autonomico.mjs` y `setup-admin-user.mjs` usaban roles como `admin_autonomico` o `admin_nacional`. El Middleware y las APIs exigen estrictamente `super_autonomico` y `super_nacional`. Esto causaba redirecciones al login o errores 403.
   - *La Solución:* **Usar siempre el prefijo `super_` para roles administrativos.** Se han actualizado los scripts para reflejar esta jerarquía. No usar el prefijo `admin_` en `user_metadata.role`.

## Casos Borde:
- **Protección de Identidades:** Los endpoints públicos como `/api/public/visualizar/[id]` JAMÁS deben cargar o exponer la información de Interventores (`usuarios(nombre_completo...`) asociados a las mesas.
- Si un Autonómico interactúa con sus paneles, la comprobación comunitaria (`unidadComunidad !== userComunidad`) ahora se realiza analizando la proyección de DB directa y evita problemas al intentar obtener provincias nacionales.
