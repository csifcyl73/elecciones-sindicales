# SOP: Gestión de Federaciones y Asociaciones Sindicales (Jerarquías)

## Objetivo
Implementar un sistema de vinculación entre sindicatos que permita agrupar resultados electorales bajo entidades superiores (Federaciones, Confederaciones o Intersindicales), asegurando que estas entidades se gestionen correctamente y no interfieran con la selección individual de sindicatos en procesos electorales.

## Motivación
- Ejemplo: USCAL + CESM + TISCYL -> El total computa como CESM.
- Ejemplo: SATSE + ANPE -> El total computa como FSES (aunque FSES no se presente como tal).

## Lógica de Negocio y Reglas
1. **Atributo "Es Federación"**: Todo sindicato nuevo o existente puede ser marcado como tal. Una federación es una entidad que puede "contener" a otros sindicatos.
2. **Vinculación de Sindicato**: Cada sindicato "de base" puede tener asignada una (y solo una) federación o asociación.
3. **Restricción en Elecciones**: Al configurar una Unidad Electoral o dar de alta sindicatos en un proceso, NO se deben mostrar las entidades marcadas como "Es Federación". Solo los sindicatos que realmente se personan en las mesas.
4. **Acumulación de Representatividad**: Los delegados obtenidos por un sindicato se imputan a su federación si la tiene. Si no tiene, se imputan al propio sindicato.
5. **Autogestión**: En el formulario de sindicatos, el usuario debe poder crear una nueva federación "al vuelo" si no existe en el desplegable.

## Pasos de Implementación
1. **[COMPLETADO] Actualización de Base de Datos**: Columnas `es_federacion` (BOOLEAN DEFAULT FALSE) y `federacion_id` (INT FK → sindicatos.id) añadidas a `public.sindicatos` mediante `scripts/add_federation_fields.py`.
2. **[COMPLETADO] Modificación de Interfaz (Nacional)** — `src/app/admin/nacional/gestion-sindicatos/page.tsx`:
    - Modal **Añadir** y modal **Editar** incluyen toggle `¿Es Federación?` y selector de federación vinculada.
    - Botón **"+ Nueva"** junto al selector abre un mini-formulario inline (Siglas + Nombre) que crea la federación al vuelo, la añade al estado local y la selecciona automáticamente. Contexto `'edit'` o `'add'` controla a qué modal se asigna.
    - Tooltip informativo en ambos modales.
    - Modales con `overflow-y-auto` para permitir scroll cuando el formulario inline crece.
3. **[PENDIENTE] Ajuste de Filtros**:
    - Revisar el módulo de `configurar-elecciones` para filtrar y excluir registros donde `es_federacion = true`.
4. **[COMPLETADO] Visualización de Estructura**: El listado muestra la federación asociada y la etiqueta [FEDERACIÓN / CONFEDERACIÓN] en verde.

## Patrón UI: Alta Rápida de Federación (Inline)
- Estado compartido: `showNewFedForm: 'edit' | 'add' | null`, `newFedSiglas`, `newFedNombre`, `savingNewFed`.
- Función: `handleCreateFederacionInline(context)` — crea la federación con `es_federacion: true`, la añade a `sindicatos` local, y asigna el ID al modal activo.
- **Trampa conocida**: El selector de federaciones usa `federaciones = sindicatos.filter(s => s.es_federacion && s.id !== selectedSindicato?.id)`. Al crear inline, el nuevo registro se añade al estado => aparece inmediatamente en el dropdown.

## Advertencias y Restricciones Conocidas
- **Evitar bucles**: Un sindicato que es federación no debería apuntar a otra federación (evitar multinivel por ahora para simplificar, a menos que se requiera explícitamente).
- **Consistencia**: Si un sindicato pasa a ser federación, se debe validar si ya tiene votos en procesos anteriores y cómo afecta eso al histórico.
- **Borrado**: Considerar el impacto de borrar una federación en los sindicatos que dependen de ella.
- **Columnas BD**: Si la migración no se ha ejecutado, el API fallará silenciosamente. Ejecutar `python scripts/add_federation_fields.py` si las columnas no existen.

## Resultados Esperados
- Columnas `es_federacion` y `federacion_id` en tabla `sindicatos`. ✓
- Modal Añadir y Editar con selector de federación y botón inline. ✓
- Alta rápida de federación sin salir del formulario de sindicato. ✓
- Tooltip informativo implementado. ✓
