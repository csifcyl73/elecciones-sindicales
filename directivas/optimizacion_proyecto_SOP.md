# Auditoría de Optimización del Proyecto - SOP

## Objetivo
Limpiar, reorganizar y optimizar la estructura del proyecto para mejorar la mantenibilidad, reducir la deuda técnica acumulada y preparar la base de código para un crecimiento escalable.

## Fase 1: Limpieza de Artefactos Muertos

### Problema
El proyecto acumula archivos huérfanos en la raíz (scripts de debug, tests de un solo uso, archivos SQL supersedidos) y scripts obsoletos en `scripts/` que ensucian la estructura y dificultan la navegación.

### Acción
1. Crear una carpeta `_deprecated/` para archivos que ya cumplieron su propósito.
2. Mover a `_deprecated/` los archivos huérfanos de la raíz del proyecto.
3. Mover a `_deprecated/scripts/` los scripts de debug/test obsoletos.
4. Eliminar archivos vacíos (0 bytes) como `schema.sql`.
5. Verificar que el build sigue pasando correctamente.

### Archivos Identificados para Deprecar

#### Raíz del proyecto
- `check_provs.js` — Script de verificación de provincias (un solo uso, ya ejecutado).
- `fetch_ccaa.js` — Fetch puntual de comunidades autónomas (ya importadas).
- `fix_ids.js` — Corrección puntual de IDs (ya ejecutado).
- `test_db.js` / `test_db_2.js` — Tests de conexión puntuales.
- `fix_rls.sql` — Supersedido por `supabase/fase2_rls.sql`.
- `schema.sql` — Archivo vacío (0 bytes), generado por intento fallido de dump.
- `.env.vercel.tmp` — Archivo temporal de configuración.

#### Scripts (`scripts/`)
- `debug_schema.js`, `debug_units.mjs` — Scripts de diagnóstico puntual.
- `check_colegio_column.js`, `check_supa.mjs`, `check_api.mjs` — Verificaciones ya superadas.
- `check_db_unidades.mjs`, `check-status.mjs` — Chequeos de estado obsoletos.
- `fix_env.js`, `fix_env.mjs` — Parches de entorno ya aplicados.
- `fix_db.mjs`, `fix-admin.mjs` — Correcciones puntuales ya ejecutadas.
- `scan_units.mjs`, `test-login.mjs`, `test_unidades_api.mjs` — Tests manuales.
- `signup-admin.mjs` — Supersedido por `crear_admin.mjs`.
- `update_db.js` — Actualización puntual ya aplicada.
- `patch_config.mjs`, `patch_config.py` — Parches de configuración ya aplicados.

### Restricciones
- **NO deprecar** archivos de configuración activos (`next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`).
- **NO deprecar** `.env.produccion.backup` (backup intencional del usuario).
- **NO deprecar** scripts de setup/producción activos (`crear_admin.mjs`, `create-admin-user.mjs`, `create-test-autonomico.mjs`, `populate-masters.mjs`, `populate-unions.mjs`, `inicializar_proyecto.mjs`, `apply-migration.mjs`).
- **NO deprecar** scripts de auditoría recientes (`fase2_*.py`, `fase3_*.py`).
- Verificar build después de mover archivos.

### ✅ Resultado (Ejecutado 2026-04-21)
- 26 archivos movidos a `_deprecated/`. Build limpio. 0 regresiones.

---

## Fase 2: Poda de Dependencias

### Problema
El `package.json` contiene paquetes que no se importan en ningún archivo del código fuente (`src/`), lo cual infla el bundle y aumenta la superficie de ataque.

### Análisis Realizado
| Paquete | Importaciones en `src/` | Scripts activos | Acción |
|---|---|---|---|
| `@tabler/icons-react` | 0 | 0 | ✅ **Eliminado** |
| `html-to-image` | 0 | 0 | ✅ **Eliminado** |
| `pg` | 0 | 3 (`add-municipio`, `apply-migration`, `reparar_frankfurt`) | Conservado (scripts lo necesitan) |
| `tw-animate-css` | 1 (`globals.css`) | — | Conservado (activo) |
| `shadcn` | 1 (`globals.css`) | — | Conservado (activo) |

### ✅ Resultado
- 2 dependencias eliminadas, 3 paquetes menos en `node_modules`. Build limpio.

### Restricciones Aprendidas
- **NOTA:** `pg` se usa en scripts `.mjs` activos, NO en el código fuente de Next.js. No eliminarlo a menos que se migren o deprecien esos scripts.

---

## Fase 3: Resolución de Vulnerabilidades

### Problema
`npm audit` reportaba 5 vulnerabilidades (3 moderate, 2 high).

### Acciones
1. **`npm audit fix`** (sin forzar): Resolvió 3 vulnerabilidades moderadas (`@hono/node-server`, `dompurify`, `hono`).
2. **`npm audit fix --force`**: Actualizó `next` de 16.2.1 → **16.2.4**, corrigiendo una vulnerabilidad high (DoS con Server Components).
3. **`xlsx` (SheetJS):** Vulnerabilidad high sin fix disponible. Es una limitación conocida de la edición Community. La versión Pro parchea estos CVEs pero es de pago. Riesgo mitigado porque `xlsx` solo se invoca en importaciones de Excel controladas por administradores autenticados tras el firewall del middleware.

### ✅ Resultado
- De 5 vulnerabilidades → **1 restante** (sin fix posible para `xlsx`). Build limpio en Next.js 16.2.4.

### Restricciones Aprendidas
- **NOTA:** `xlsx` (SheetJS CE) tiene CVEs abiertos permanentes sin parche para la edición gratuita. Si en el futuro se requiere eliminar esta vulnerabilidad, considerar migrar a `exceljs` o `xlsx-parse` como alternativa.

---

## Fase 4: Refactorización DRY — Módulos Nacional / Autonómico

### Problema
Los módulos `admin/nacional/` y `admin/autonomico/` contienen **~700 KB de código** (377 KB + 324 KB) con **~90% de duplicación** entre pares de archivos. Las únicas diferencias reales entre cada par son:

1. **Rutas de navegación** (`/admin/nacional/dashboard` vs `/admin/autonomico/dashboard`).
2. **Textos/Labels** ("Panel Nacional" vs "Panel Autonómico", footer).
3. **Carga de datos** (Nacional carga todos los datos; Autonómico filtra por `comunidad` del usuario).
4. **Funcionalidades exclusivas Nacional**: Importación Excel de sindicatos, gestión de administradores autonómicos, `ModalImportarHistorico`.

### Pares Duplicados Identificados

| Módulo | Nacional | Autonómico | Diferencia Real |
|---|---|---|---|
| Gestión Sindicatos | 35.2 KB (688 líneas) | 32.6 KB (637 líneas) | Nacional tiene importar/exportar Excel |
| Gestión Unidades | 30.8 KB (561 líneas) | 31.0 KB (564 líneas) | Autonomico filtra por comunidad |
| Configurar Elecciones | 56.6 KB | 56.5 KB | Autonomico filtra por comunidad |
| Gestión Interventores | 16.9 KB | 16.9 KB | Solo rutas/labels |
| Informes | 67.2 KB | 67.5 KB | Solo rutas/labels |
| Visualizar | 42.0 KB + 60.0 KB | 33.7 KB + 61.0 KB | Nacional tiene multi-select delete |
| Dashboard | 8.9 KB | 9.6 KB | Menú diferente |

### Estrategia: Extracción de Hooks de Lógica Compartida

**NO se va a unificar el JSX/UI** (demasiado riesgo de regresión visual). En su lugar, se extraerá la **lógica de negocio** (estado, handlers, API calls) a **custom hooks compartidos** en `src/lib/hooks/`.

Esto elimina la duplicación de la parte más propensa a bugs (lógica) manteniendo la flexibilidad del UI.

#### Hooks a Extraer

1. `useGestionSindicatos.ts` — CRUD de sindicatos, federaciones inline, búsqueda.
2. `useGestionUnidades.ts` — CRUD unidades/procesos, filtrado, agrupación.
3. `useGestionInterventores.ts` — CRUD interventores.
4. `useInformes.ts` — Carga de datos, generación Excel, filtros.
5. `useVisualizarElecciones.ts` — Listado, filtrado, multi-select.
6. `useVisualizarDetalle.ts` — Detalle de elección, cálculo proporcional.
7. `useConfigurarElecciones.ts` — Formulario de configuración, guardado.

#### Patrón de cada Hook

```typescript
// src/lib/hooks/useGestionSindicatos.ts
interface UseGestionSindicatosOptions {
  perfil: 'nacional' | 'autonomico';
}

export function useGestionSindicatos({ perfil }: UseGestionSindicatosOptions) {
  // Todo el estado (useState)
  // Todos los handlers (loadSindicatos, handleSaveEdit, handleAddNew, handleDelete, etc.)
  // return { estado, handlers }
}
```

Cada página del admin se reduce a:
```tsx
// src/app/admin/nacional/gestion-sindicatos/page.tsx
export default function Page() {
  const { state, actions } = useGestionSindicatos({ perfil: 'nacional' });
  return <JSX usando state y actions />;
}
```

### Orden de Ejecución (de menor a mayor riesgo)

1. **useGestionSindicatos** — ✅ Completado (`8dfae4e`)
2. **useGestionUnidades** — ✅ Completado (`af83cdf`)
3. **useGestionInterventores** — ✅ Completado (`5d7fe7a`)
4. **useInformes** — ⏸️ Aplazado (ver restricciones aprendidas)
5. **useVisualizarElecciones** + **useVisualizarDetalle** — ⏸️ Aplazado
6. **useConfigurarElecciones** — ⏸️ Aplazado

### Restricciones
- **NO mover ni renombrar archivos de página** (`page.tsx`). Next.js App Router los necesita donde están.
- **NO unificar JSX**: Cada perfil mantiene su propio return JSX con sus textos y rutas.
- **Verificar build después de cada hook** antes de pasar al siguiente.
- **Un commit por hook extraído** para facilitar revert granular si algo falla.
- **El componente `CheckCircle2` inline** (definido al final de gestion-sindicatos) debe moverse a `lucide-react` import o a un componente compartido.

### ✅ Resultado (Ejecutado 2026-04-22)
- 3 hooks extraídos en `src/lib/hooks/`:
  - `useGestionSindicatos.ts` — CRUD sindicatos, federaciones inline, importación Excel
  - `useGestionUnidades.ts` — CRUD unidades/procesos, filtrado por comunidad (autonómico)
  - `useGestionInterventores.ts` — CRUD interventores, generación de credenciales
- **Reducción neta: ~850 líneas eliminadas** de código duplicado en `src/app/admin/`
- Build limpio verificado tras cada extracción
- 3 commits granulares independientes para revert seguro

### Restricciones Aprendidas
- **NOTA: Informes, Visualizar y Configurar NO son buenos candidatos para extracción de hooks.** Estos módulos tienen 1200+ líneas cada uno con lógica de generación PDF (jsPDF), captura de gráficos (html2canvas), y rendering de charts (recharts) profundamente acoplada al JSX. La única diferencia real entre Nacional y Autonómico es la URL de carga inicial (1 línea). Extraer un hook de 600+ líneas para ahorrar 1 línea no es justificable.
- **NOTA: Para los módulos grandes (>500 líneas), la estrategia correcta es extraer SOLO la carga de datos** a un helper function compartido (no un hook completo), dejando el resto de la lógica in-situ.

---

## Fase 5: Reorganización del Directorio `scripts/`

### Problema
Los 24 scripts activos restantes (tras la limpieza de Fase 1) se encontraban todos mezclados en un único directorio plano sin estructura, dificultando localizar el script correcto.

### Acción
Reorganizar en 4 subcarpetas temáticas:

```
scripts/
├── setup/          # 10 scripts - Inicialización, creación de usuarios, poblado de tablas
├── migraciones/    #  5 scripts - Migraciones SQL, añadir campos, reparaciones de BD
├── mantenimiento/  #  3 scripts - Limpieza de duplicados, normalización de nombres
└── auditoria/      #  7 scripts - Fases de auditoría de seguridad y optimización
```

### ✅ Resultado (Ejecutado 2026-04-21)
- 25 archivos organizados en 4 categorías. Directorio `scripts/` raíz queda limpio (0 archivos sueltos). Build limpio.

### Restricciones Aprendidas
- **NOTA Windows:** Los emojis Unicode (📁) no se pueden imprimir en la consola de PowerShell con codificación cp1252. Usar texto ASCII plano en scripts de Python que imprimen por consola.

---

## Fase 6: Resolución de Errores de Build (Turbopack)

### Problema
Durante el despliegue en Vercel con Next.js 16.2.4 (Turbopack), se producía el error `Module not found: Can't resolve '@react-email/render'` al importar `resend`. Turbopack es estricto con las dependencias dinámicas implícitas de `resend`.

### Acción
1. Instalar `@react-email/render` explícitamente en `package.json` mediante `npm install @react-email/render`.

### ✅ Resultado (Ejecutado 2026-04-27)
- Dependencia añadida. Build en Turbopack completado con éxito y error resuelto.

### Restricciones Aprendidas
- **NOTA:** Siempre que se use la librería `resend` en entornos Next.js con Turbopack, la dependencia `@react-email/render` debe estar declarada explícitamente en el `package.json`, aunque no se importe directamente en el código de la aplicación.
