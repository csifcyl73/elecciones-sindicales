# SOP - Entorno de Prácticas (Sandbox Mode)

## Objetivo
Crear un módulo aislado o "Modo Pruebas" dentro de la aplicación oficial que permita a los administradores autonómicos simular procesos electorales de principio a fin (incluyendo gestión de sindicatos, altas de interventores y toma de datos simulada) sin alterar ni "ensuciar" los datos estadísticos y globales del sistema oficial.

## Arquitectura de la Solución (Aproximación "Stripe Test Mode")

1. **Modificación de la Base de Datos (Estrategia de Flag)**
   Se descartará crear una base de datos secundaria para evitar doble mantenimiento.
   La mejor estrategia es añadir un campo booleano `is_sandbox` (por defecto `false`) a todas las tablas relacionales y maestras que el administrador pueda alterar:
   - `unidades_electorales`
   - `usuarios` (para diferenciar interventores reales de interventores de prueba)
   - `sindicatos`
   - `mesas_electorales`
   - `resultados_consolidados`
   - `procesos_electorales`

2. **Frontend Interfaz de Modo Prácticas**
   - En el Dashboard Nacional y Autonómico, implantar un Toggle o Interruptor global: **[Modo Real] / [Modo Sandbox]**.
   - Al activar el Modo Sandbox, se altera una cookie de sesión (`sandbox_mode=true`) y se aplica un tema visual de advertencia generalizado (ej. interfaz con bordes naranjas o amarillos, y marca de agua de "ENTORNO DE SIMULACIÓN" en el fondo) para que el administrador siempre sepa en qué entorno está operando.

3. **Backend y Middlewares**
   - Todas las llamadas a las API (`/api/admin/...` y `/api/interventores/...`) leerán la cookie `sandbox_mode`.
   - Si la cookie es `true`, todas las sentencias de Supabase aplicarán implícitamente `.eq('is_sandbox', true)`. Si es `false`, leerán código oficial.
   - Mismo comportamiento para inserciones y borrados. *Si un usuario está en sandbox, sus Sindicatos creados no los verá nadie del modo real.*

4. **Flujo simulado del Interventor**
   - Cuando un admin crea un "interventor de pega", este se guarda con `is_sandbox = true` y recibe su correo/mensaje de prueba si se desea.
   - El interventor accede a la misma URL de la aplicación (`localhost` o dominio final).
   - Al autenticarse, si el sistema detecta que el usuario tiene la marca `is_sandbox = true`, automáticamente pinta el portal del interventor en el modo "Simulación" de colores llamativos y vincula las respuestas únicamente a las mesas de prueba. No se requiere portal web paralelo, es el mismo endpoint con estado visual alterado.

## Fases de Implementación Propuesta

1. **DB Migration**: Crear un script (`scripts/setup_sandbox_mode.mjs`) que aplique las columnas `is_sandbox` mediante sentencias `ALTER TABLE` a las tablas objetivo y actualice todo lo histórico a `false`.
2. **Global State & Middleware**: Implementar el gestor de la cookie de estado Sandbox y el proveedor de Contexto React que pinte la UI de simulación.
3. **Refactorización de APIs**: Parametrizar las llamadas existentes hacia Supabase para que todas reconozcan la inyección del filtro relacional.

## Restricciones Informadas
- **Casos Borde de Usuarios Globales**: Los Admins que cambien entre modos son los mismos usuarios de la tabla de perfiles (que no son eliminados, solo operan actuando como proxies del entorno de prueba).
- **Seguridad**: Asegurar a través de Row Level Security (RLS) en Supabase (si está definido activo), que modificar datos de estado opuesto al de la cookie retorne Forbidden, evitando accesos cruzados por vulnerabilidades de URL directas.
