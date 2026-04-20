# SOP - Consolidación de Unidades Electorales

## Objetivo
Desacoplar la identidad "plantilla" de una unidad electoral (su nombre fundamental, sector y órgano) de los atributos geográficos o temporales específicos en los selectores, evitando duplicados en la UI.

## Pasos de Ejecución
1. **Limpieza de Nombres en Base de Datos**: Identificar unidades cuyo nombre contenga el de una provincia entre paréntesis (ej. `COMITÉ DE EMPRESA AEAT (BURGOS)`) y estandarizarlo al nombre base (`COMITÉ DE EMPRESA DE AEAT`).
2. **Modificación de Configuración (`save-config.ts`)**: Al guardar la configuración de una elección, si el usuario seleccionó una unidad base y le cambia la provincia o el año, el backend DEBE crear una nueva instancia (si no existe) o actualizar una instancia existente separada. No de sobrescribir la unidad original a otra provincia.
3. **Optimización de UI de Configuración**: Las listas desplegables se deben poblar deduplicando estrictamente por el campo `nombre`, mostrando "COMITÉ DE EMPRESA DE AEAT" una sola vez para todo el territorio nacional.

## Restricciones y Casos Borde
- **Falsos positivos en nombres con paréntesis**: Típicamente no deben limpiarse textos como `(TÉCNICOS)` u `(ESPECIALISTAS)`, solo aquellos que se correspondan con nombres de entidades geográficas implícitas en el texto a limpiar, o de forma general los de la provincia. 
- **Sobreescritura en DB**: Si `save-config.ts` no estuviera corregido, renombrar y reasignar una provincia desde el frontend sobrescribiría permanentemente la unidad "plantilla", afectando a la provincia original. 

## Script de Automatización
- Script ejecutado: `scripts/limpiar_nombres_unidades.mjs`
- Modificación de servidor: `src/app/api/admin/save-config/route.ts` actualizados.
