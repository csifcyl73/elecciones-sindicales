import { NextRequest, NextResponse } from 'next/server';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const MIN_SCORE_THRESHOLD = 0.5;

/**
 * POST /api/auth/verify-captcha
 *
 * Verifica un token de Google reCAPTCHA v3 en el servidor.
 * NUNCA expone la Secret Key al cliente.
 *
 * Body: { token: string }
 * Response OK: { success: true, score: number }
 * Response Error: { success: false, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token de verificación no proporcionado.' },
        { status: 400 }
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      // Si no hay clave configurada (ej. entorno de pruebas sin .env),
      // permitimos el acceso con una advertencia de servidor.
      console.warn('[verify-captcha] RECAPTCHA_SECRET_KEY no configurada. Omitiendo verificación.');
      return NextResponse.json({ success: true, score: 1.0, bypassed: true });
    }

    // Verificar el token contra la API de Google
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    const googleResponse = await fetch(`${RECAPTCHA_VERIFY_URL}?${params}`, {
      method: 'POST',
    });

    if (!googleResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Error al contactar con el servicio de verificación.' },
        { status: 502 }
      );
    }

    const data = await googleResponse.json();

    // data.success = true si el token es válido
    // data.score = 0.0 (bot) a 1.0 (humano)
    // data['error-codes'] = array de errores si los hay

    if (!data.success) {
      const errorCodes = data['error-codes'] || [];
      console.warn('[verify-captcha] Verificación fallida:', errorCodes);
      return NextResponse.json(
        { success: false, error: 'Token de seguridad inválido o expirado.' },
        { status: 400 }
      );
    }

    if (data.score < MIN_SCORE_THRESHOLD) {
      console.warn(`[verify-captcha] Score demasiado bajo: ${data.score}. Posible bot.`);
      return NextResponse.json(
        {
          success: false,
          error: 'Verificación de seguridad fallida. Si eres un humano, inténtalo de nuevo.',
          score: data.score,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, score: data.score });

  } catch (error) {
    console.error('[verify-captcha] Error inesperado:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
