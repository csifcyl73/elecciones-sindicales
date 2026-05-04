# SOP: Implementación de Google reCAPTCHA v3 — Elecciones Sindicales

## Objetivo
Añadir Google reCAPTCHA v3 (invisible, basado en puntuación) a todos los formularios de login del proyecto para prevenir ataques de fuerza bruta y bots, sin friccionar la experiencia del usuario legítimo.

## Stack Tecnológico
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Auth:** Supabase Auth
- **CAPTCHA elegido:** Google reCAPTCHA v3 (invisible, score ≥ 0.5)
- **Librería cliente:** `react-google-recaptcha-v3`

## Formularios Afectados (Scope)

| Ruta | Archivo | Rol |
|---|---|---|
| `/admin/nacional` | `src/app/admin/nacional/page.tsx` | Admin Nacional |
| `/admin/autonomico` | `src/app/admin/autonomico/page.tsx` | Admin Autonómico |
| `/interventor` | `src/app/interventor/page.tsx` | Interventor |

## Arquitectura de la Solución

```
Cliente (Browser)
    └── GoogleReCaptchaProvider (wraps el layout)
         └── Formulario de login
              └── useGoogleReCaptcha() → ejecuta → token
                   └── POST /api/auth/login (con token)
                        └── [Servidor] verifica token en Google API
                             └── Si score ≥ 0.5 → Supabase Auth login
```

## Variables de Entorno Necesarias

```env
# .env.local (y en Vercel Dashboard)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Le...     # Clave pública (visible en cliente)
RECAPTCHA_SECRET_KEY=6Le...               # Clave secreta (SOLO servidor)
```

## Pasos de Implementación

### PASO 0: Obtener claves en Google reCAPTCHA Admin
1. Ir a https://www.google.com/recaptcha/admin
2. Crear nuevo sitio → Tipo: **reCAPTCHA v3**
3. Dominios: `localhost`, `tu-dominio.vercel.app` (y dominio de producción)
4. Copiar Site Key y Secret Key

### PASO 1: Instalar dependencias
```bash
npm install react-google-recaptcha-v3
```

### PASO 2: Añadir variables de entorno
- En `.env.local`: las dos claves
- En Vercel Dashboard: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` y `RECAPTCHA_SECRET_KEY`

### PASO 3: Crear componente proveedor `RecaptchaProvider`
- Archivo: `src/components/RecaptchaProvider.tsx`
- Wraps `GoogleReCaptchaProvider` con la site key
- Se usa en el `layout.tsx` raíz

### PASO 4: Crear API Route de verificación `/api/auth/verify-captcha`
- Archivo: `src/app/api/auth/verify-captcha/route.ts`
- Recibe: `{ token: string }`
- Llama a `https://www.google.com/recaptcha/api/siteverify`
- Retorna: `{ success: boolean, score: number }`
- **Umbral mínimo**: score ≥ 0.5 (ajustable)

### PASO 5: Modificar formularios de login
- Importar `useGoogleReCaptcha` de `react-google-recaptcha-v3`
- Antes de `supabase.auth.signInWithPassword()`:
  1. Ejecutar `executeRecaptcha('login')`
  2. Llamar a `/api/auth/verify-captcha` con el token
  3. Si falla verificación → mostrar error, NO intentar login en Supabase
  4. Si pasa → continuar con el flujo normal

### PASO 6: Añadir `RecaptchaProvider` al layout raíz
- `src/app/layout.tsx` ya existe
- Envolver el `{children}` con `<RecaptchaProvider>`

## Restricciones / Casos Borde Conocidos

- **CRÍTICO:** `RECAPTCHA_SECRET_KEY` nunca debe tener prefijo `NEXT_PUBLIC_`. Si lo tiene, queda expuesta al cliente → brechas de seguridad.
- **CRÍTICO:** La verificación del token SIEMPRE debe hacerse en el servidor (API Route), nunca en el cliente. El cliente solo obtiene el token.
- **Nota:** reCAPTCHA v3 es invisible. No hay checkbox. El usuario no nota nada salvo el badge de Google en esquina inferior.
- **Nota:** El score varía de 0.0 (bot) a 1.0 (humano). Umbral recomendado para login: 0.5. Se puede subir a 0.7 si hay muchos falsos positivos.
- **Nota:** `react-google-recaptcha-v3` requiere que el componente que use `useGoogleReCaptcha()` sea hijo de `GoogleReCaptchaProvider`.
- **Restricción Vercel:** Las variables `NEXT_PUBLIC_*` deben re-deployarse para activarse. Las no-públicas se leen en runtime en Server Components/API Routes.
- **Dominio localhost:** Añadir `localhost` como dominio autorizado en Google reCAPTCHA Admin Console para que funcione en desarrollo.
- **Error conocido:** Si `executeRecaptcha` devuelve null/undefined, el provider no está correctamente montado. Verificar que `RecaptchaProvider` esté en el layout raíz y no dentro de un componente cliente sin contexto.

## Archivos Modificados / Creados

| Acción | Archivo |
|---|---|
| CREAR | `src/components/RecaptchaProvider.tsx` |
| CREAR | `src/app/api/auth/verify-captcha/route.ts` |
| MODIFICAR | `src/app/layout.tsx` |
| MODIFICAR | `src/app/admin/nacional/page.tsx` |
| MODIFICAR | `src/app/admin/autonomico/page.tsx` |
| MODIFICAR | `src/app/interventor/page.tsx` |
| MODIFICAR | `.env.local` |

## Criterios de Éxito

- [ ] El formulario de login en `/admin/nacional` no se puede enviar sin token de CAPTCHA válido
- [ ] Un ataque de fuerza bruta automatizado recibe score < 0.5 y es rechazado antes de tocar Supabase
- [ ] Los usuarios legítimos (score ≥ 0.5) logran autenticarse normalmente
- [ ] No se expone la Secret Key en el cliente (verificar en DevTools → Network)
- [ ] Funciona en localhost y en producción Vercel
