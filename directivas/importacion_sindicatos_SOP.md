# Directiva: Importación Masiva de Sindicatos vía Excel

## Objetivo
Implementar una funcionalidad robusta en el módulo de "Gestión de Sindicatos" (Administrador Nacional) que permita la carga masiva y automatizada de sindicatos a través de una plantilla de Excel (.xlsx, .xls), optimizando el tiempo frente a la carga manual.

## Componentes Involucrados
1. **Frontend (`src/app/admin/nacional/gestion-sindicatos/page.tsx`)**
2. **Backend/API (`src/app/api/admin/sindicatos/import/route.ts`)**
3. **Librería Externa:** `xlsx` (necesaria para el parseo del archivo en el frontend y la generación de la plantilla).

## Pasos de Ejecución (Planificación)

### Fase 1: Preparación
1. Instalar la dependencia necesaria: `npm install xlsx`.

### Fase 2: Desarrollo del Frontend (Interfaz y Parseo)
1. **Botón de Plantilla:** Añadir un botón "Descargar Plantilla" que utilice `xlsx` para generar y descargar un archivo modelo (columnas: `Siglas` y `Nombre completo`).
2. **Input de Archivo:** Incorporar un botón de "Importar masivo" que active un input de tipo `file` oculto, restringido a `.xlsx` y `.xls`.
3. **Parseo y Validación:** Al seleccionar el archivo, procesar su contenido con `FileReader` y la librería `xlsx`.
   - Formatear todo el texto aplicando `.trim()` y `.toUpperCase()`.
   - Empaquetar los datos estructurados en un arreglo de objetos JSON con la estructura esperada de tabla plana.
4. **Envío:** Hacer POST a la ruta API. Mostrar notificaciones o el estado "Cargando importación..." y notificar cuántos se insertaron correctamente vs omitidos.

### Fase 3: Desarrollo del Backend (API Ruteo y DB)
1. **Nuevo Endpoint:** Crear un archivo `src/app/api/admin/sindicatos/import/route.ts` para manejar un array (este enfoque aísla la lógica de un insert individual).
2. **Autorización:** Ejecutar `requireAuth(['super_nacional', 'super_autonomico'])`.
3. **Gestión de Identificadores (Restricción Conocida):** La tabla actual presenta una rareza en la constraint `sindicatos_pkey`.
   - Antes del bulk insert masivo, obtener el id máximo actual (`select id orderby desc limit 1`).
   - Mapear el array del excel forzando secuencialmente el ID: `nextId = MaxID + index + 1`.
4. **Manejo de Duplicados (Restricción Borde):** Ignorar los que generen conflicto de la constraint de unicidad (siglas). Esto se hará fácilmente haciendo un Select de todas las `siglas` actuales y filtrando (excluyendo del bulk insert) aquellas de la tabla entrante que ya coincidan en la base de datos de supabase para poder retornar al cliente "X sindicatos ignorados por estar duplicados".
5. **Inserción de Bloque:** Invocar `.insert(array_validos)` de Supabase para guardar todo lo novedoso de una atacada.

## Trampas Conocidas y Reglas
- **Restricción:** Constraint `sindicatos_pkey` fallará si la inserción asume auto-incremento genérico porque se ha insertado fuera de la secuencia o existen valores alterados. **Regla:** Computar de antemano el mapping de la llave primaria `id`.
- **Restricción:** Límite silencioso del payload size límite en Vercel si un Excel es monstruoso (se limitará el parsing a 1000 filas).
