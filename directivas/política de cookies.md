# Guía de Implementación: Disclaimer de Cookies (España)

Esta guía detalla los requisitos legales y técnicos según la **Agencia Española de Protección de Datos (AEPD)**, el **RGPD** y la **LSSI** para el correcto tratamiento de cookies en sitios web españoles.

---

## 1. El Banner de Cookies (Primera Capa)

El banner es el aviso inicial que ve el usuario. Para que sea legal, debe cumplir con:

- **Botón de "Rechazar todas":** Debe ser tan visible como el de "Aceptar". No se permite ocultarlo en menús secundarios.
- **Botón de "Aceptar todas":** Permite el consentimiento masivo.
- **Botón de "Configurar":** Enlace a un panel donde el usuario pueda elegir qué tipos de cookies permite.
- **Información básica:** Breve explicación sobre si las cookies son propias o de terceros y su finalidad (ej. analítica, publicidad).
- **Identificación:** Nombre del titular de la web o marca comercial.

## 2. Política de Cookies (Segunda Capa)

Es el documento detallado (página aparte) vinculado desde el banner. Debe incluir:

- **Definición de cookies:** Explicación técnica sencilla.
- **Cuadro detallado de cookies:** Una tabla con:
    - **Nombre:** Identificador de la cookie.
    - **Proveedor:** Quién la emite (Google, Facebook, propia).
    - **Finalidad:** Técnica, analítica, publicitaria, etc.
    - **Duración:** Plazo de caducidad (sesión, 1 año, etc.).
- **Instrucciones de deshabilitación:** Pasos para que el usuario bloquee o elimine cookies desde la configuración de los navegadores más comunes (Chrome, Firefox, Safari, Edge).

## 3. Requisitos Técnicos del Consentimiento

- **Bloqueo previo (Prior Blocking):** No se debe instalar ninguna cookie (salvo las técnicas) antes de que el usuario haga clic en "Aceptar".
- **Acción positiva:** El consentimiento debe ser una acción clara. Acciones pasivas como **hacer scroll o seguir navegando ya no se consideran válidos**.
- **Casillas desmarcadas:** En el panel de configuración, todas las categorías de cookies (excepto las técnicas) deben estar **desmarcadas por defecto**.
- **Fácil revocación:** El usuario debe poder cambiar de opinión en cualquier momento. Se recomienda un botón flotante de "Configuración de cookies" visible en toda la web.

## 4. Cookies Exentas de Aviso

No requieren consentimiento las cookies estrictamente necesarias para la funcionalidad:
1. **Entrada del usuario:** Cesta de la compra, formularios.
2. **Seguridad:** Autenticación de usuarios.
3. **Personalización de interfaz:** Elección de idioma o moneda, siempre que sea a petición del usuario.
4. **Equilibrio de carga:** Para el funcionamiento del servidor.

## 5. Prohibiciones y Buenas Prácticas

- **Evitar "Dark Patterns":** No uses colores que confundan al usuario (ej. poner "Rechazar" en gris claro sobre fondo blanco y "Aceptar" en verde brillante).
- **Muro de cookies (Cookie Wall):** No puedes impedir el acceso a la web por no aceptar cookies, a menos que ofrezcas una alternativa (que puede ser de pago) para navegar sin ellas.
- **Renovación del consentimiento:** El consentimiento debe renovarse al menos cada **24 meses**.
