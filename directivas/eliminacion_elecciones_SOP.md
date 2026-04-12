# SOP - Eliminación de Procesos Electorales (Unidades)

## Objetivo
Permitir al administrador nacional eliminar unidades electorales (elecciones específicas) de forma segura y definitiva desde el panel de visualización.

## Requisitos de UI
- **Icono**: Papelera (`Trash2`) visible en cada card de elección en el módulo "Visualizar".
- **Color**: Rojo/Rosa para indicar acción destructiva.
- **Ventana Emergente (Modal)**: 
  - Título de advertencia (ELEGIR BIEN LOS TÉRMINOS).
  - Descripción: "Esta acción es definitiva y borrará todos los datos asociados a esta elección (mesas, interventores, votos)."
  - Botón: **ELIMINAR DEFINITIVAMENTE** (Rojo).
  - Botón: **CANCELAR** (Neutro).

## Lógica de Backend
- **Endpoint**: `DELETE /api/admin/unidades/[id]`.
- **Integridad**: Al eliminar la unidad, se deben limpiar (o dejar huérfanos según RLS) los registros asociados en `mesas_electorales` y `votos_partidos` si existieran. (Nota: Generalmente se usa `ON DELETE CASCADE` en la DB, pero verificar).
- **Seguridad**: Solo accesible para Administrador Nacional.

## Impacto
- Una vez eliminada, la unidad dejará de aparecer en:
  - El listado de Visualización del Admin.
  - El módulo de consulta pública "Elecciones" del portal principal.
  - El panel del Interventor asignado.

## Restricciones
- No permitir el borrado si la unidad está en un estado protegido (opcional, por ahora se permite a libre elección del administrador nacional).
- Asegurar que el modal detenga la propagación del click para no navegar al detalle de la elección accidentalmente.
- **Importaciones Lucide**: Al añadir iconos destructivos (Trash2, AlertTriangle), asegurar que NO se eliminen los iconos de visualización existentes (MapPin, Building2, Layers) del bloque de importación.
