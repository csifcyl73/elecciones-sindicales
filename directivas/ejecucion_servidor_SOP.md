# SOP - Ejecución del Servidor de Desarrollo

## Objetivo
Iniciar y mantener operativo el servidor de desarrollo local de Next.js para permitir la previsualización y pruebas del sistema de elecciones sindicales.

## Pasos de Ejecución
1. **Verificación de Entorno**: Asegurar que las dependencias estén instaladas y `.env.local` sea válido (paso previo en el SOP de Inicialización).
2. **Arranque del Servidor**: Ejecutar `npm run dev`.
3. **Validación de Acceso**: Abrir y supervisar el acceso a `http://localhost:3000`.
4. **Monitoreo de Errores**: Capturar y diagnosticar logs de error en la consola del servidor.

## Restricciones y Casos Borde
- **Ausencia de Python**: En este entorno específico, Python no está disponible en el PATH. **DEBES usar scripts de Node.js (.mjs)** en su lugar para delegar tareas, a pesar de la regla general de Python.
- **Puerto Ocupado**: Si el puerto 3000 está ocupado, buscar y liberar el proceso o iniciar en un puerto alternativo.
- **Errores de Compilación**: Reportar inmediatamente errores de TypeScript o de compilación de Next.js.
- **Acceso Remoto**: El servidor local suele ser accesible solo desde la máquina del usuario; si se requiere acceso externo, usar túneles (ej. `ngrok`) si el equipo lo permite.

## Script de Automatización
Se debe usar `node scripts/ejecutar_servidor.mjs` para iniciar el entorno.
