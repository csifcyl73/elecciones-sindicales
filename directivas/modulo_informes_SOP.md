# SOP — Módulo de Ejecución de Informes (Mission Control)

## Objetivo
Implementar en `/admin/nacional/informes` un visualizador analítico avanzado de elecciones sindicales. El módulo permite seleccionar múltiples **unidades electorales** (no procesos agrupadores) de forma simultánea y analiza los resultados bajo 5 vistas distintas, con exportación masiva de informes.

**Nota arquitectónica (v2):** La primera implementación usaba `procesos_electorales` como unidad de selección. Se corrigió para usar `unidades_electorales` (igual que el module de visualizar) porque la tabla de procesos puede estar vacía aunque haya cientos de unidades con datos reales. El panel izquierdo carga desde `/api/admin/unidades` con los **6 filtros** del visualizador (búsqueda libre, año, provincia, sector, tipo de órgano, unidad electoral).

## Arquitectura

### Rutas
- **Página principal:** `src/app/admin/nacional/informes/page.tsx`
- **API de datos agregados:** `src/app/api/admin/informes/datos/route.ts`
- **API de exportación Excel:** `src/app/api/admin/informes/excel/route.ts`

### APIs de las que depende (ya existentes)
- `/api/admin/procesos-electorales` → lista de todos los procesos
- `/api/admin/unidades` → unidades con metadatos (provincia, sector, órgano, año)
- `/api/admin/visualizar/[id]` → detalle de una elección (votos, consolidados)
- `/api/admin/sindicatos` → listado de sindicatos

### API: `/api/admin/informes/datos`
- **Método:** GET con query string `?ids=uuid1,uuid2,...` (IDs de **unidades_electorales**)
- **Devuelve:** Para cada unidad, la agregación de delegados por sindicato
- **Auth:** `requireAuth(['super_nacional', 'super_autonomico'])`
- **Lógica:**
  1. Recibe array de `unidad_id`
  2. Busca metadatos de esas unidades (provincia, sector, tipos_organos, anio)
  3. Busca `resultados_consolidados` de esas unidades con `sindicatos(siglas, nombre_completo)`
  4. Agrega delegados por sindicato dentro de cada unidad
  5. Mantiene el orden de selección del usuario
  6. Devuelve array ordenado de `{ id, nombre, anio, sindicatos, totalDelegadosObtenidos, ... }`

### Nueva API: `/api/admin/informes/excel`
- **Método:** GET con query string `?ids=uuid1,uuid2,...`
- **Devuelve:** Buffer binario `.xlsx`
- **Librería:** `xlsx` (SheetJS, ya disponible o a instalar)
- **Hojas generadas:**
  - "Resumen": tabla por proceso con totales
  - "Por Sindicato": tabla cruzada sindicatos × procesos
  - "Por Provincia": tabla cruzada provincias × procesos

## Layout del Módulo (Propuesta A - Mission Control)

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER: Volver + Título + contador KPIs                              │
├────────────────┬────────────────────────────────────────────────────┤
│ PANEL IZQ      │               ÁREA PRINCIPAL                        │
│ w-80 fijo      │                                                      │
│                │  TOOLBAR: tabs de vista + botón Exportar            │
│ [Filtros]      │  ────────────────────────────────────               │
│ Año / CCAA /   │  KPI Cards (Delegados / Procesos / Sindicatos)      │
│ Sector         │  ────────────────────────────────────               │
│                │  [Vista activa: gráfico/tabla]                       │
│ ─ ─ ─ ─ ─ ─   │                                                      │
│ [Lista proc.]  │                                                      │
│ ☑ Proc. 2024  │                                                      │
│ ☑ Proc. 2022  │                                                      │
│ ☐ Proc. 2019  │                                                      │
│                │                                                      │
│ [Exportar ZIP] │                                                      │
└────────────────┴────────────────────────────────────────────────────┘
```

## Vistas Analíticas (Tabs)

1. **Comparativa Sindicatos** — BarChart agrupado de delegados por sindicato × proceso (usando `recharts`)
2. **Tabla Cruzada** — Grid HTML nativo: filas = sindicatos, columnas = procesos, celdas = delegados + %
3. **Evolución Temporal** — LineChart de delegados totales por sindicato a lo largo del tiempo (orden cronológico)
4. **Por Sector** — BarChart apilado agrupando delegados por sector
5. **Índice de Representatividad** — Tabla ranking con badge de umbral (>15% verde, >10% amarillo, <10% rojo)
6. **Por Sindicato (Ficha Sindicato)** — Vista interactiva con selector para aislar un sindicato en concreto y visualizar la distribución exacta de sus delegados extraídos agrupados por Sector, por Provincia y desglosado por Unidad Electoral.

## Lógica de Colores de Sesión
- Cada proceso seleccionado recibe un color secuencial de la paleta (9 colores):
  `['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316']`
- El color se usa en gráficos y en el chip del panel izquierdo

## Exportación
- **Exportar sesión actual (Excel):** Llama a `/api/admin/informes/excel?ids=...`, descarga `.xlsx` multi-hoja
- **Exportar PDF comparativo:** Genera client-side con `jsPDF` (importado dinámicamente). Incluye:
  - Portada con header corporativo (slate-900) + fecha + nº de elecciones
  - KPIs (delegados obtenidos, elecciones, a elegir, sindicatos distintos)
  - Ficha detallada por cada elección (cabecera con color de sesión, KVs, tabla de sindicatos con delegados y %)
  - Tabla cruzada sindicatos × elecciones (si hay ≥2 seleccionadas)
  - Índice de representatividad con umbrales ≥15% / ≥10%
  - Pies de página automáticos en todas las páginas
- **Nota:** `jsPDF` ya está disponible en el proyecto (usado en el visualizador de detalle). No requiere instalación adicional.

## Restricciones y Casos Borde

- **CRÍTICO — Nombre de columna en `resultados_consolidados`:** La columna de delegados NO se llama `delegados_obtenidos`. El importador histórico (`/api/admin/importar-historico`) y el escrutinio normal guardan los datos en `delegados_totales` (y `delegados_directos` como campo auxiliar). Usar siempre `delegados_totales ?? delegados_directos ?? 0`. Usar `delegados_obtenidos` devuelve siempre `undefined` → los gráficos aparecen vacíos sin ningún error visible.
- **Máximo 9 procesos en sesión:** El límite es configurable — sólo depende del tamaño de `SESSION_COLORS` y el valor de guard en `toggleUnidad`. Se elevó de 6 a 9 en v3. Para aumentarlo más, añadir colores a la paleta y cambiar el `>= 9`.
- **Proceso sin resultados consolidados:** Si `resultados_consolidados` está vacío, mostrar "Sin datos de escrutinio" en la vista comparativa sin crashear.
- **recharts no soporta SSR:** Usar `dynamic(() => import(...), { ssr: false })` si es necesario. O simplemente garantizar que el componente está en un cliente con `"use client"`.
- **xlsx es CommonJS:** Importar con `import * as XLSX from 'xlsx'` en el route handler del servidor. No importar desde el cliente.
- **Auth:** Sólo `super_nacional` en esta primera fase. No `super_autonomico`.
- **Rendimiento:** La API de datos debe hacer las queries en paralelo (`Promise.all`) por proceso para evitar N+1.

## Dependencias a instalar
```
npm install recharts xlsx
```
(Si `recharts` ya está instalado, verificar con `package.json`)

## Estado de implementación
- [x] Directiva creada
- [x] API `/api/admin/informes/datos/route.ts` — Auth: `super_nacional` + `super_autonomico`
- [x] API `/api/admin/informes/excel/route.ts` — Exporta workbook multi-hoja
- [x] Página `/admin/nacional/informes/page.tsx` — 5 vistas, panel lateral, KPIs, chips de sesión
- [x] Verificación en dev server — Carga correctamente, sin errores
- [x] Filtro "Unidad Electoral" en panel izquierdo (v3)
- [x] Exportación PDF comparativo con jsPDF (v3)

## Restricciones adicionales descubiertas en ejecución

- **La tabla `procesos_electorales` puede estar vacía:** Si la organización no ha creado procesos agrupadores, el panel mostrará "Sin procesos". Esto es comportamiento correcto — la herramienta analiza procesos, no unidades sueltas. No es un error del módulo.
- **El usuario `castillayleon@csif.es` tiene rol `super_autonomico`** pero accede al panel nacional. Funciona porque la auth del panel nacional verifica exactamente `role === 'super_nacional'` en el middleware, pero si el usuario puede llegar al módulo de informes, las APIs de informes aceptan ambos roles para no bloquear.
- **`recharts` no hay que instalar**: ya estaba en `package.json`. Ídem `xlsx`.
- **Colores de sesión**: Paleta de 6 colores asignada secuencialmente `['#10b981','#6366f1','#f59e0b','#ec4899','#3b82f6','#8b5cf6']`. El color del proceso 0 = verde emerald, el 1 = indigo, etc.
