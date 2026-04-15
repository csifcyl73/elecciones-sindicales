# Directiva: Importación Masiva de Datos Históricos (Modo B - Por Delegados)

## Objetivo
Permitir al Administrador Nacional y al Administrador Autonómico importar resultados de procesos electorales pasados mediante un archivo Excel (.xlsx/.xls), insertando los datos directamente en `resultados_consolidados` y creando la infraestructura de unidad electoral necesaria. Las unidades creadas por este mecanismo quedan en estado `congelada` (resultados oficiales bloqueados).

## Componentes Involucrados
1. **Frontend Nacional:** `src/app/admin/nacional/visualizar/page.tsx` (modal integrado)
2. **Frontend Autonómico:** `src/app/admin/autonomico/visualizar/page.tsx` (modal integrado)
3. **API Backend:** `src/app/api/admin/importar-historico/route.ts`
4. **Librería:** `xlsx` (parseo en frontend)

## Estructura de la Plantilla Excel (Modo B)

| Columna | Obligatorio | Descripción |
|---|---|---|
| PROVINCIA | Sí | Nombre exacto de provincia (ej: MADRID) |
| MUNICIPIO | No | Nombre del municipio o "NO PROCEDE" |
| SECTOR | Sí | Nombre del sector (ej: EDUCACIÓN) |
| TIPO_ORGANO | Sí | Nombre del tipo de órgano (ej: JUNTA DE PERSONAL) |
| AÑO | Sí | Año numérico (ej: 2022) |
| UNIDAD_ELECTORAL | Sí | Nombre exacto de la unidad |
| CENSO | Sí | Número entero del censo total |
| DELEGADOS_TOTAL | Sí | Total de delegados a repartir |
| DELEGADOS_CSIF | No | Delegados obtenidos por CSIF |
| DELEGADOS_UGT | No | Delegados obtenidos por UGT |
| DELEGADOS_* | No | Una columna por cada sindicato presente |

## Lógica del Backend (SOP Estricto)

### Fase 1: Validación de Cabeceras
- Verificar que existen las columnas obligatorias. Si faltan, retornar error 400 inmediato.
- Las columnas `DELEGADOS_*` se detectan dinámicamente extrayendo la sigla (todo lo que hay después de `DELEGADOS_`).

### Fase 2: Procesamiento por Fila (idempotente)
Para cada fila del Excel:
1. **Provincia:** `.select().ilike('nombre', valor)` — buscar sin ser sensible a mayúsculas.
2. **Sector y Tipo Órgano:** igual que provincia. Si no existe, **crearlos** con `upsert`.
3. **Sindicatos:** Para cada columna `DELEGADOS_*`: si el sindicato por sigla no existe, **crearlo** con nombre_completo = siglas (actualizable manualmente después). Usar el patrón de ID secuencial de importacion_sindicatos_SOP.md para evitar conflictos de constraint pkey.
4. **Unidad Electoral:** Hacer `select` buscando por `nombre` + `provincia_id` + `anio`. Si existe, **actualizar**. Si no existe, **crearla** con `estado = 'congelada'`.
5. **Mesa Ficticia:** Crear una única mesa con `nombre_identificador = 'IMPORTACIÓN HISTÓRICA'` y `censo_real = CENSO` del Excel. Si ya existe, actualizar el censo.
6. **Resultados Consolidados:** Para cada sindicato que tenga delegados > 0: hacer `upsert` en `resultados_consolidados` con `delegados_totales = valor`, `delegados_directos = valor`, `delegados_por_restos = 0`.

### Fase 3: Respuesta al Cliente
Retornar JSON con: `{ importadas, actualizadas, errores: [{fila, motivo}] }`

## Restricciones y Casos Borde (Trampas Conocidas)

- **Restricción Pkey Sindicatos:** La tabla `sindicatos` tendrá conflicto si el auto-incremento está desfasado. **Regla:** Antes de insertar sindicatos nuevos, obtener MAX(id) y asignar IDs secuenciales manuales, igual que en `importacion_sindicatos_SOP.md`.
- **Idempotencia:** Si se reimporta el mismo Excel (misma unidad + año), el sistema debe actualizar datos, NO duplicar. Usar `upsert` en unidades y resultados_consolidados.
- **Autorización Autonómica:** El endpoint debe verificar que si el rol es `super_autonomico`, las provincias de las filas pertenezcan a su `ccaa_id`. Filas fuera del ámbito se omiten y se registran en la sección `errores`.
- **Formato Numérico:** Los campos CENSO y DELEGADOS_* pueden llegar como string del Excel. Siempre hacer `parseInt()` con fallback a 0.
- **Límite de Filas:** Máximo 500 filas por archivo. Si el Excel supera ese límite, cortar y notificar.
- **Estado de Unidad:** Las unidades creadas por importación histórica siempre tienen `estado = 'congelada'`. Esto asegura que aparezcan en el visualizador con la etiqueta "Resultados Oficiales".
