# SOP - Configurador de Elecciones (Admin Nacional)

## Objetivo
Implementar un formulario robusto para que el administrador nacional configure nuevas unidades electorales con parámetros geográficos, sectoriales y orgánicos.

## Estructura del Formulario
1.  **Provincia**: Desplegable vinculado a la tabla `provincias`.
2.  **Sector**: Desplegable con opciones predefinidas (AGE, AGCA, Educación, Sanidad, Justicia, Local, EPE, Privada).
3.  **Unidad Electoral**: 
    - Desplegable dinámico que filtra por provincia/sector.
    - Botón de acción para crear una nueva unidad si la necesaria no existe.
4.  **Tipo de Órgano**: Desplegable (Junta de Personal, Comité de Empresa, Representante de los trabajadores).

## Flujo de Datos
- **Lectura**: Al cargar la página, se deben obtener los maestros de Supabase.
- **Escritura**: Al guardar, se crea un registro en `unidades_electorales` con estado `configuracion`.
- **UI/UX**: Uso de `shadcn/ui` (o componentes Tailwind personalizados) con animaciones de entrada y feedback de carga.

## Seguridad
- Validar sesión activa de Administrador Nacional.
- Sanitización de entradas para la creación de nuevas unidades electorales.
