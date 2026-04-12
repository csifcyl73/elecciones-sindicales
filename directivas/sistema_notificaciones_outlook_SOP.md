# SOP - Sistema de Notificaciones vía Outlook (Client-Side)

## Objetivo
Unificar el sistema de notificaciones de la plataforma para que dependa exclusivamente de la aplicación de correo local del usuario (Outlook, Mail, etc.) mediante enlaces `mailto:`. Esto elimina la dependencia de servicios de terceros (Resend) y permite la revisión manual del mensaje antes del envío.

## Módulos Migrados
1.  **Configurador de Elecciones**: Notificación de asignación a interventores.
2.  **Gestión de Interventores**: Envío inicial de credenciales (Usuario/Password).
3.  **Alta de Administrador Autonómico**: Envío de credenciales tras creación de cuenta.

## Protocolo de Implementación
Para cualquier nuevo módulo que requiera envío de información por correo:

1.  **Estado Controlado**: Incluir un estado `enviarEmail` (boolean) para que el usuario decida si desea disparar la notificación.
2.  **Generación de Mailto**:
    - **Destinatario**: Email del usuario afectado.
    - **Asunto**: Formateado profesionalmente y prefijado por el contexto (ej: `[CSIF] Tus credenciales...`).
    - **Cuerpo**: Codificado mediante `encodeURIComponent`. Debe incluir:
        - Saludo personalizado.
        - Datos relevantes (URL de acceso, usuario, password/pin).
        - Firma institucional.
3.  **Disparo**: Usar `window.location.href = mailtoLink`.
4.  **Timing**: El disparo debe ocurrir **después** de confirmar que los datos se han guardado correctamente en la base de datos (Supabase).

## Restricciones
- No utilizar la API interna `/api/send-email` (basada en Resend) para procesos administrativos.
- Asegurar que todos los campos del cuerpo del mensaje estén en mayúsculas donde sea institucionalmente apropiado (nombres de unidades, nombres de personas).
- El sistema de `mailto:` tiene un límite aproximado de 2000 caracteres; mantener los mensajes concisos.

## Seguridad
- No exponer credenciales en la URL si el entorno requiere máxima privacidad (aunque el uso de `mailto:` es el estándar solicitado por el usuario para mayor control manual).
- Las contraseñas se generan en el cliente o se reciben del backend, pero nunca se guardan en logs.
