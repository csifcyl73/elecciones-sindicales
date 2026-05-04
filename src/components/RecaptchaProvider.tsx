"use client";

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

/**
 * Proveedor global de Google reCAPTCHA v3.
 * Debe envolver todas las páginas que contengan formularios protegidos.
 * Se instancia en el RootLayout para cubrir toda la aplicación.
 */
export default function RecaptchaProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    // En desarrollo sin clave configurada, renderizamos sin protección
    // pero emitimos advertencia en consola
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[RecaptchaProvider] NEXT_PUBLIC_RECAPTCHA_SITE_KEY no está configurada. ' +
        'El reCAPTCHA está desactivado. Configura la variable en .env.local'
      );
    }
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      language="es"
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
