# Procesos Electorales - SOP

## Objetivo
Implementar la entidad "Proceso Electoral" que agrupa varias elecciones individuales (unidades electorales) bajo un mismo paraguas temporal y administrativo, de cara a la generación de informes consolidados.

## Entradas
- Nombre del proceso electoral (texto libre, ej: "ELECCIONES GENERALES 2026")
- Periodo temporal electoral (texto libre, ej: "MARZO - JUNIO 2026")
- Observaciones (texto libre)

## Salidas
- Tabla `procesos_electorales` en Supabase
- API CRUD en `/api/admin/procesos-electorales`
- Selector desplegable en configurar-elecciones con botón "Nuevo Proceso Electoral"
- Casilla "AÑO" numérica en configurar-elecciones
- Columnas `proceso_electoral_id` y `anio` en `unidades_electorales`

## Lógica
1. Crear tabla `procesos_electorales` (id UUID, nombre TEXT, periodo TEXT, observaciones TEXT, created_at TIMESTAMPTZ)
2. Añadir columnas `proceso_electoral_id` (FK nullable) y `anio` (INT nullable) a `unidades_electorales`
3. API GET/POST para procesos electorales
4. Modificar frontend: 2 nuevas casillas al inicio del formulario (antes de Provincia)
5. Modificar save-config para persistir proceso_electoral_id y anio

## Restricciones / Casos Borde
- La asociación a proceso electoral es OPCIONAL (nullable FK)
- El año es OPCIONAL pero solo numérico (4 dígitos)
- Usar Lazy Init en cualquier SDK externo para no romper Vercel build
- Usar service_role_key en APIs de backend para bypasear RLS
