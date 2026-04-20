# Directiva: ImportaciÃ³n Masiva de Datos HistÃ³ricos (Modo B - Por Delegados)

## Objetivo
Permitir al Administrador Nacional y al Administrador AutonÃ³mico importar resultados de procesos electorales pasados mediante un archivo Excel (.xlsx/.xls), insertando los datos directamente en `resultados_consolidados` y creando la infraestructura de unidad electoral necesaria. Las unidades creadas por este mecanismo quedan en estado `congelada` (resultados oficiales bloqueados).

## Componentes Involucrados
1. **Frontend Nacional:** `src/app/admin/nacional/visualizar/page.tsx` (modal integrado)
2. **Frontend AutonÃ³mico:** `src/app/admin/autonomico/visualizar/page.tsx` (modal integrado)
3. **API Backend:** `src/app/api/admin/importar-historico/route.ts`
4. **LibrerÃ­a:** `xlsx` (parseo en frontend)

## Estructura de la Plantilla Excel (Modo B)

| Columna | Obligatorio | DescripciÃ³n |
|---|---|---|
| PROVINCIA | SÃ­ | Nombre exacto de provincia (ej: MADRID) |
| MUNICIPIO | No | Nombre del municipio o "NO PROCEDE" |
| SECTOR | SÃ­ | Nombre del sector (ej: EDUCACIÃ“N) |
| TIPO_ORGANO | SÃ­ | Nombre del tipo de Ã³rgano (ej: JUNTA DE PERSONAL) |
| AÃ‘O | SÃ­ | AÃ±o numÃ©rico (ej: 2022) |
| UNIDAD_ELECTORAL | SÃ­ | Nombre exacto de la unidad |
| CENSO | SÃ­ | NÃºmero entero del censo total |
| DELEGADOS_TOTAL | SÃ­ | Total de delegados a repartir |
| DELEGADOS_CSIF | No | Delegados obtenidos por CSIF |
| DELEGADOS_UGT | No | Delegados obtenidos por UGT |
| DELEGADOS_* | No | Una columna por cada sindicato presente |

## LÃ³gica del Backend (SOP Estricto)

### Fase 1: ValidaciÃ³n de Cabeceras
- Verificar que existen las columnas obligatorias. Si faltan, retornar error 400 inmediato.
- Las columnas `DELEGADOS_*` se detectan dinÃ¡micamente extrayendo la sigla (todo lo que hay despuÃ©s de `DELEGADOS_`).

### Fase 2: Procesamiento por Fila (idempotente)
Para cada fila del Excel:
1. **Provincia:** `.select().ilike('nombre', valor)` â€” buscar sin ser sensible a mayÃºsculas.
2. **Sector y Tipo Ã“rgano:** igual que provincia. Si no existe, **crearlos** con `upsert`.
3. **Sindicatos:** Para cada columna `DELEGADOS_*`: si el sindicato por sigla no existe, **crearlo** con nombre_completo = siglas (actualizable manualmente despuÃ©s). Usar el patrÃ³n de ID secuencial de importacion_sindicatos_SOP.md para evitar conflictos de constraint pkey.
4. **Unidad Electoral:** Hacer `select` buscando por `nombre` + `provincia_id` + `anio`. Si existe, **actualizar**. Si no existe, **crearla** con `estado = 'congelada'`.
5. **Mesa Ficticia:** Crear una Ãºnica mesa con `nombre_identificador = 'IMPORTACIÃ“N HISTÃ“RICA'` y `censo_real = CENSO` del Excel. Si ya existe, actualizar el censo.
6. **Resultados Consolidados:** Para cada sindicato que tenga delegados > 0: hacer `upsert` en `resultados_consolidados` con `delegados_totales = valor`, `delegados_directos = valor`, `delegados_por_restos = 0`.

### Fase 3: Respuesta al Cliente
Retornar JSON con: `{ importadas, actualizadas, errores: [{fila, motivo}] }`

## Restricciones y Casos Borde (Trampas Conocidas)

- **RestricciÃ³n Pkey Sindicatos:** La tabla `sindicatos` tendrÃ¡ conflicto si el auto-incremento estÃ¡ desfasado. **Regla:** Antes de insertar sindicatos nuevos, obtener MAX(id) y asignar IDs secuenciales manuales, igual que en `importacion_sindicatos_SOP.md`.
- **Idempotencia:** Si se reimporta el mismo Excel (misma unidad + aÃ±o), el sistema debe actualizar datos, NO duplicar. Usar `upsert` en unidades y resultados_consolidados.
- **AutorizaciÃ³n AutonÃ³mica:** El endpoint debe verificar que si el rol es `super_autonomico`, las provincias de las filas pertenezcan a su `ccaa_id`. Filas fuera del Ã¡mbito se omiten y se registran en la secciÃ³n `errores`.
- **Formato NumÃ©rico:** Los campos CENSO y DELEGADOS_* pueden llegar como string del Excel. Siempre hacer `parseInt()` con fallback a 0.
- **LÃ­mite de Filas:** MÃ¡ximo 500 filas por archivo. Si el Excel supera ese lÃ­mite, cortar y notificar.
- **Estado de Unidad:** Las unidades creadas por importaciÃ³n histÃ³rica siempre tienen `estado = 'congelada'`. Esto asegura que aparezcan en el visualizador con la etiqueta "Resultados Oficiales".

- **Unicidad de Entidad Corporativa**: Previamente la validación comprobaba el año para ver si existía la unidad electoral. Esto causaba multiplicidad de unidades con el mismo nombre si se cargaban Exceles de años históricos. Para mantener la normalización (la unidad es una sede física o jurídica inmutable que alberga distintas elecciones en distintos momentos cronológicos), se evalúa la idempotencia exclusivamente por 
ombre + provincia_id, NO por año. De esta forma la sede de la elección prevalece única en BD y sólo los procesos y actas se suceden.

- **Unicidad de Entidad por Nombre (Igual que Sindicatos)**: Una unidad electoral es una sede/entidad permanente única en todo el sistema, identificada únicamente por su NOMBRE (sin tener en cuenta provincia o año). Si se importa el mismo Excel en años distintos, el sistema reutiliza la unidad existente por nombre, NO crea una nueva por cada proceso. Este comportamiento es análogo al de los sindicatos, que también existen una sola vez aunque aparezcan en múltiples procesos electorales.
