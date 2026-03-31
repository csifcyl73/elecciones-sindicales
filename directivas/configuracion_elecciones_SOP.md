# SOP - Configurador de Elecciones (Admin Nacional)

## Objetivo
Implementar un formulario robusto para que el administrador nacional configure nuevas unidades electorales con parámetros geográficos, sectoriales y orgánicos.

## Estructura del Formulario
1.  **Provincia**: Desplegable vinculado a la tabla `provincias`.
2.  **Sector**: Desplegable con opciones predefinidas (AGE, AGCA, Educación, Sanidad, Justicia, Local, EPE, Privada).
3.  **Unidad Electoral**: 
    - Desplegable global (NO se filtra por provincia ni sector).
    - Botón de acción para crear una nueva unidad. Las nuevas unidades se graban sin vinculación geográfica/sectorial para estar disponibles en todo el sistema.
4.  **Tipo de Órgano**: Desplegable (Junta de Personal, Comité de Empresa, Representante de los trabajadores).

## Reglas de Validación de Coherencia
Es obligatorio validar que el nombre de la unidad electoral sea coherente con el tipo de órgano antes de permitir el paso al siguiente nivel:
- **Alerta "INCOHERENCIA ENTRE UNIDAD ELECTORAL Y TIPO DE ÓRGANO" si**:
    - Se selecciona una Unidad que contenga "JUNTA DE PERSONAL" y un Órgano tipo "COMITÉ DE EMPRESA".
    - Se selecciona una Unidad que conenga "COMITÉ DE EMPRESA" y un Órgano tipo "JUNTA DE PERSONAL".

## Reglas para Comité de Empresa (Paso 2.1)
- **Delegados**: El número total de delegados (Colegio Único o suma de Dos Colegios) DEBE SER IMPAR.
- **Acción**: Si es par, mostrar alerta: `"EL NÚMERO DE DELEGADOS TOTAL TIENE QUE SER IMPAR"`.

## Reglas para Junta de Personal (Paso 2.2)
- **Sindicatos**: Configuración idéntica al Comité de Empresa. Sindicatos globales.
- **Número de Delegados**: Valor numérico libre.
- **Validación**: DEBE SER IMPAR. Si es par, mostrar alerta: `"EL NÚMERO DE DELEGADOS TOTAL TIENE QUE SER IMPAR"`.
- **Botón**: "SIGUIENTE".

## Flujo de Datos
- **Lectura**: Al cargar la página, se deben obtener los maestros de Supabase.
- **Escritura**: Al guardar, se crea un registro en `unidades_electorales` con estado `configuracion`.
- **UI/UX**: Uso de `shadcn/ui` (o componentes Tailwind personalizados) con animaciones de entrada y feedback de carga.

## Seguridad
- Validar sesión activa de Administrador Nacional.
- Sanitización de entradas para la creación de nuevas unidades electorales.
