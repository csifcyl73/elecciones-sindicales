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
