# SOP - Configurador de Elecciones (Admin Nacional)

## Objetivo
Implementar un formulario robusto para que el administrador nacional configure nuevas unidades electorales con parámetros geográficos, sectoriales y orgánicos.

## Estructura de la Single Page Application (Todo en un paso)
- **Provincia**: Buscador desplegable de provincias.
- **Localidad**: Buscador desplegable de municipios españoles (`municipios.json`).
- **Unidad Electoral**: Desplegable global (NO se filtra por provincia ni sector). Incluye botón de creación de nueva unidad. Alerta de Incoherencia si difiere con Órgano.
- **Tipo de Órgano**: Desplegable (Junta de Personal, Comité de Empresa, etc).
- **Delegados**: 
  - Si "COMITÉ DE EMPRESA": Mostrar radio/botones para "COLEGIO ÚNICO" o "DOS COLEGIOS".
    - Si "COLEGIO ÚNICO": un campo numérico.
    - Si "DOS COLEGIOS": dos campos numéricos.
  - Si "JUNTA DE PERSONAL": un campo numérico.
  - **Validación Estricta**: La suma/valor total DEBE SER IMPAR.
- **Asignar Interventor**: Buscador desplegable de usuarios con rol `interventor`.
- **Botón Grabar**: Guarda todas las elecciones de una y activa el protocolo de notificación.
- **Protocolo de Notificación**: Al guardar con éxito, se debe disparar un enlace `mailto:` que abra el cliente de correo predeterminado (Outlook) con los interventores en copia, asunto formal y cuerpo estandarizado.

## Flujo de Datos
- **Lectura**: Obtención masiva de maestros por Supabase y el JSON de `municipios`.
- **Escritura**: 
  1. `unidades_electorales` (update con total delegados, provincia, tipo de órgano).
  2. `mesas_electorales` (creación de MESA 1 base y asignación de interventor).
  3. POST a la API (o simulación) de envío de email al interventor.
- **UI/UX**: Unificación de flujo, sin subrutas ni pasos intermedios. Usar `shadcn/ui` custom styling con esmeraldas y transparencias para el estilo Premium CSIF.

## Seguridad
- Validar sesión activa de Administrador Nacional.
- Sanitización de entradas para la creación de nuevas unidades electorales.
