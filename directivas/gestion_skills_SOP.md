# SOP: Gestión e Instalación de Skills

## Objetivo
Asegurar la instalación exitosa de skills externas en el entorno de Antigravity, minimizando errores por nombres incorrectos o rutas inexistentes.

## Entradas
- **Repositorio**: URL del repositorio de GitHub que contiene las skills.
- **Nombre de la Skill**: El identificador de la carpeta que contiene el archivo `SKILL.md`.

## Lógica y Pasos
1. **Verificación de Origen**: Antes de instalar, se debe verificar el nombre exacto de la carpeta dentro del repositorio. Los nombres "comerciales" pueden diferir del nombre de la carpeta (ej. `security-review` podría ser `cc-skill-security-review`).
2. **Ejecución del Comando**: Utilizar `npx skills add <URL> --skill <NOMBRE_EXACTO>`.
3. **Validación**: Comprobar que la carpeta ha sido creada en `c:\Users\asus\.agents\skills`.
4. **Registro de Fallos**: Si el comando falla, investigar la estructura del repo y actualizar esta directiva con la "Trampa Conocida" encontrada.

## Restricciones y Casos Borde (Trampas Conocidas)
- **Nota**: El repositorio `sickn33/antigravity-awesome-skills` NO contiene una carpeta llamada `security-review`.
- **Acción Correctiva**: Para seguridad, se deben usar los nombres específicos:
    - `cc-skill-security-review` para revisión general.
    - `gha-security-review` para GitHub Actions.
- **Error Exit Code 1**: Si el comando devuelve exit code 1 sin mensaje claro, suele significar que la skill especificada no se encontró en el repositorio.
- **Instalador interactivo bloqueado**: `npx skills add` puede quedar bloqueado en un menú interactivo en Windows que no responde a señales de teclado desde el agente. En ese caso, usar el script Python `scripts/instalar_skill_manual.py` para clonado y copia directa.
- **Nombre de destino vs nombre en repo**: La skill puede instalarse con un nombre diferente al de la carpeta en el repositorio. Usar el parámetro `target_skill_name` en el script para renombrar al instalar.

## Trampas de Seguridad Conocidas (de cc-skill-security-review)

### Zod en Next.js (TypeScript)
- **Nota**: En Zod v4+, los errores de validación se acceden con `.issues`, NO con `.errors`.
    - ❌ `parsed.error.errors[0].message`
    - ✅ `parsed.error.issues[0].message`

### Supabase Auth: getSession() vs getUser() en servidor
- **Nota**: En rutas de API de servidor, NUNCA usar `getSession()`. Usar siempre `getUser()`.
    - `getSession()` devuelve datos del JWT local sin verificar con el servidor de autenticación. Un JWT manipulado puede saltarse esta verificación.
    - `getUser()` siempre verifica contra el servidor de Supabase Auth.
    - El middleware ya documenta esta regla en el propio código.
- **Excepción**: En componentes de cliente (hooks), `getUser()` también es la opción correcta pero no tiene impacto de seguridad crítico (el servidor siempre revalida).

### error.message en respuestas HTTP
- **Nota**: Nunca exponer `error.message` de errores de Supabase o del servidor directamente al cliente.
    - Los mensajes pueden contener nombres de tablas, columnas, stack traces o información interna.
    - Patrón correcto: `console.error('[endpoint] Error:', err)` + `return NextResponse.json({ error: 'Mensaje genérico.' })`.
    - Excepciones permitidas: mensajes de validación de negocio ya filtrados (ej. "usuario ya existe").
Asegurar la instalación exitosa de skills externas en el entorno de Antigravity, minimizando errores por nombres incorrectos o rutas inexistentes.

## Entradas
- **Repositorio**: URL del repositorio de GitHub que contiene las skills.
- **Nombre de la Skill**: El identificador de la carpeta que contiene el archivo `SKILL.md`.

## Lógica y Pasos
1. **Verificación de Origen**: Antes de instalar, se debe verificar el nombre exacto de la carpeta dentro del repositorio. Los nombres "comerciales" pueden diferir del nombre de la carpeta (ej. `security-review` podría ser `cc-skill-security-review`).
2. **Ejecución del Comando**: Utilizar `npx skills add <URL> --skill <NOMBRE_EXACTO>`.
3. **Validación**: Comprobar que la carpeta ha sido creada en `c:\Users\asus\.agents\skills`.
4. **Registro de Fallos**: Si el comando falla, investigar la estructura del repo y actualizar esta directiva con la "Trampa Conocida" encontrada.

## Restricciones y Casos Borde (Trampas Conocidas)
- **Nota**: El repositorio `sickn33/antigravity-awesome-skills` NO contiene una carpeta llamada `security-review`. 
- **Acción Correctiva**: Para seguridad, se deben usar los nombres específicos:
    - `cc-skill-security-review` para revisión general.
    - `gha-security-review` para GitHub Actions.
- **Error Exit Code 1**: Si el comando devuelve exit code 1 sin mensaje claro, suele significar que la skill especificada no se encontró en el repositorio.
