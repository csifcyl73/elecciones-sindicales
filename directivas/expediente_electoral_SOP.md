# SOP - Integración de Expediente Electoral (Cloud Storage)

## Objetivo
Automatizar la creación de un árbol de carpetas (expediente administrativo) en la nube (Google Drive/Dropbox) cuando se da de alta un nuevo proceso/unidad electoral, reflejando las 6 fases legales de las elecciones sindicales. Proveer una UI para visualizar y expandir este árbol.

## Arquitectura de la Solución

1. **Estructura en Base de Datos**:
   - Evitar tablas complejas si es posible. Añadir a la tabla `unidades_electorales` una columna `expediente_url`.
   - Crear una tabla `nodos_expediente` (unidad_id, fase_id, tipo_nodo, url, folder_id, es_opcional) para indexación rápida en la UI sin tener que consultar a la API de Drive constantemente.

2. **Integración con Proveedor Cloud**:
   - Elegir un proveedor (Drive o Dropbox). Se recomienda una **Service Account** (Google Drive) o **App Scoped Token** (Dropbox) para que la aplicación cree las carpetas automáticamente en una unidad compartida corporativa, sin requerir Oauth manual del usuario.
   - **Módulo Core**: Módulo Node.js con métodos `crearEstructuraBase(unidad_id)` y `crearCarpetaOpcional(unidad_id, tipo_nodo)`.

3. **Flujo de Ejecución (Creación Automática)**:
   - Durante la configuración de la elección (`api/admin/save-config/route.ts`), tras insertar la unidad en Supabase, se llama de forma asíncrona a `crearEstructuraBase()`.
   - Se crean las carpetas obligatorias y se almacenan los enlaces en `nodos_expediente`.

4. **Flujo de Interfaz (Visor UI)**:
   - En la página de detalle de la unidad (`visualizar/[id]/page.tsx`), pestaña "Expediente".
   - Lectura de estructura desde base de datos local.
   - Botones "Crear Fase/Reclamación" mapeados contra Endpoints del backend que, al finalizar con éxito en Drive, insertan el registro en `nodos_expediente` y devuelven el View resfrescado a la UI.

## Fases y Nodos del Árbol (Esquema Legal)

*   **Fase 1: Promoción o Preaviso**
    *   `1.1_Registro_Preaviso_OPR` (Obligatorio)
    *   `1.1.1_Recursos_Contra_Preaviso` (Opcional - Creable vía UI)
    *   `1.2_Comunicacion_Empresa_Trabajadores` (Obligatorio)
*   **Fase 2: Constitución de la Mesa y Censo**
    *   `2.1_Acta_Constitucion_Mesa` (Obligatorio)
    *   `2.1.1_Recursos_Contra_Acta_Constitucion` (Opcional - Creable vía UI)
    *   `2.2_Censo_Provisional_Y_Calendario` (Obligatorio)
    *   `2.2.1_Reclamaciones_Censo_Provisional_Y_Calendario` (Opcional - Creable vía UI)
    *   `2.3_Censo_Definitivo` (Obligatorio)
    *   `2.3.1_Reclamaciones_Contra_Censo_Definitivo` (Opcional - Creable vía UI)
*   **Fase 3: Presentación de Candidaturas**
    *   `3.1_Presentacion_Candidaturas` (Obligatorio)
    *   `3.1.1_Reclamaciones_Contra_Candidaturas` (Opcional - Creable vía UI)
    *   `3.2_Proclamacion_Provisional_Candidaturas` (Obligatorio)
    *   `3.2.1_Reclamaciones_Contra_Proclamacion_Provisional` (Opcional - Creable vía UI)
    *   `3.3_Proclamacion_Definitiva` (Obligatorio)
    *   `3.3.1_Reclamaciones_Contra_Proclamacion_Definitiva` (Opcional - Creable vía UI)
*   **Fase 4: Campaña electoral**
    *   `4.1_Campaña_Electoral` (Obligatorio)
*   **Fase 5: Escrutinio y Resultados**
    *   `5.1_Votacion_Y_Acta_Escrutinio` (Obligatorio)
    *   `5.2_Publicacion_Tablones` (Obligatorio)
*   **Fase 6: Registro OPR**
    *   `6.1_Presentacion_OPR` (Obligatorio)
    *   `5.ACT_Subsanacion_Defectos` (Opcional)
    *   `5.2_Registro_Oficial` (Obligatorio)
*   **Fase 6: Impugnaciones (Vía Arbitral)** -> *Se inicia manual desde UI*
    *   `6.1_Reclamacion_Previa_Mesa`
    *   `6.2_Inicio_Procedimiento_Arbitral` 
    *   `6.3_Laudo_Arbitral`
    *   `6.4_Impugnacion_Juzgado_Social` 

## Restricciones Informadas 
- **Timeouts**: La creación de en batch de 15 carpetas puede hacer saltar un Timeout. Ejecutar Fire-and-Forget, NO en el hilo del Return de la API de UI.
- **Cuotas (Rate Limits)**: Manejo de reintentos mediante delay en las APIs de Drive/Dropbox si saltan errores `429`.
