# SOP - Depuraciones y Mejoras de UI (Visualizador, Interventores, Sindicatos)

## Objetivo
Implementar tres mejoras en la aplicación:
1.  **Visualizador de Elecciones (Móvil):** Solucionar el problema de visualización responsiva que oculta las elecciones en fase de escrutinio en dispositivos móviles.
2.  **Módulo Principal de Interventores:** Añadir la visualización de la "provincia" y "localidad/municipio" en la tarjeta de elección asignada, junto a la unidad electoral, mesa y colegio.
3.  **Módulo de Gestión de Sindicatos:** Agregar una funcionalidad (botón + modal/formulario) para permitir la creación de nuevos sindicatos en la base de datos.

## Procedimiento
1.  **Auditoría y Parcheo del Visualizador:** Identificar las clases de CSS que aplican estilos en pantallas pequeñas (`sm:`, `md:`) y asegurarse de que las tarjetas o listas de escrutinio no tengan `hidden` o dimensiones colapsadas en formato móvil.
2.  **Consulta y UI de Interventores:** Actualizar el fetch de la base de datos para incluir las columnas relevantes, y modificar la tarjeta UI para renderizarlas.
3.  **Gestor de Sindicatos:** Insertar un botón "Añadir Sindicato", un estado para mostrar el modal, y conectar a la API correspondiente (`POST` a Supabase o al endpoint de apis de sindicatos) para crearlos.

## Restricciones y Casos Borde
-   *Responsividad:* No romper la vista de escritorio al arreglar la vista móvil.
-   *Base de datos Sindicatos:* Verificar los campos requeridos (`nombre`, `siglas`, `color`, `logo_url`).
-   *Datos relacionales Interventores:* Asegurar que la query hacia `mesas` traiga los datos de `unidades` (provincia, localidad/municipio).
