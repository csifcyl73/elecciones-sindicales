# SOP: Integración de Google Analytics

## Objetivo
Implementar Google Analytics (GA4) en el proyecto Next.js de elecciones-sindicales de manera optimizada y sin afectar el rendimiento de la aplicación (Core Web Vitals).

## Entradas
- **ID de Medición**: El ID proporcionado por Google Analytics (formato `G-XXXXXXXXXX`).

## Lógica y Pasos
1. **Instalación de la librería recomendada**:
   Next.js proporciona una librería específica para scripts de terceros. 
   ```bash
   npm install @next/third-parties@latest
   ```
2. **Configuración de la variable de entorno**:
   Añadir el ID de medición a los archivos `.env` (ej. `.env.local` y `.env.production.local`):
   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```
3. **Implementación en el Layout Principal**:
   Se debe modificar el archivo `src/app/layout.tsx` para incluir el componente de Google Analytics.
   ```tsx
   import { GoogleAnalytics } from '@next/third-parties/google';

   // ... dentro de la etiqueta <body> o <html>
   <body className="...">
      {children}
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
   </body>
   ```

## Restricciones y Casos Borde (Trampas Conocidas)
- **Bloqueo del renderizado**: Nunca pegar el `<script>` crudo de Google directamente en el HTML de Next.js, ya que puede bloquear la hidratación o la carga de la página. Usar siempre `@next/third-parties` o, en su defecto, `next/script` con strategy `afterInteractive`.
- **Doble carga**: Asegurarse de ponerlo solo en el `RootLayout` y no en layouts de subrutas.
- **Content Security Policy (CSP)**: Si hay una política CSP estricta en el `next.config.ts`, podría bloquear las peticiones a Google Analytics. Asegurarse de que el dominio de Google esté permitido en `connect-src` e `img-src` si fuera necesario. (Revisar el CSP actual).
