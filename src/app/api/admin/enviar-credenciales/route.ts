import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { email, nombre, password, pin } = await req.json();

    if (!email || !nombre || !password) {
      return NextResponse.json({ error: 'Faltan datos del interventor' }, { status: 400 });
    }

    // Nota: El remitente 'onboarding@resend.dev' es para pruebas gratuitas. 
    // Para producción definitiva el usuario deberá configurar su dominio.
    const { data, error } = await resend.emails.send({
      from: 'CSIF Elecciones <onboarding@resend.dev>',
      to: [email],
      subject: '🔑 TUS CREDENCIALES DE INTERVENTOR - CSIF ELECCIONES',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background-color: #0d2137; padding: 30px; text-align: center;">
            <p style="color: #4ade80; font-weight: 800; font-size: 24px; margin: 0; letter-spacing: -0.05em;">CSIF ELECCIONES</p>
            <p style="color: rgba(255,255,255,0.4); font-size: 10px; margin-top: 5px; font-weight: 700; text-transform: uppercase;">Portal del Interventor de Mesa</p>
          </div>
          
          <div style="padding: 40px; background-color: #ffffff;">
            <h1 style="color: #111827; font-size: 22px; font-weight: 900; margin-bottom: 20px;">HOLA, ${nombre.toUpperCase()} 👋</h1>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
              Has sido dado de alta como <strong>Interventor de Mesa</strong> en el sistema de gestión de elecciones sindicales de CSIF. A continuación tienes tus datos de acceso seguros:
            </p>
            
            ${password !== 'ACCESO_YA_EXISTENTE' ? `
            <div style="background-color: #f3f4f6; border-radius: 16px; padding: 25px; margin-bottom: 30px; border-left: 5px solid #2563eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; font-weight: 700; text-transform: uppercase;">Usuario (Email)</p>
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; font-weight: 800;">${email}</p>
              
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; font-weight: 700; text-transform: uppercase;">Contraseña Temporal</p>
              <p style="margin: 0 0 0 0; color: #111827; font-size: 16px; font-weight: 800;">${password}</p>
            </div>
            ` : ''}

            <div style="background-color: #fef3c7; border-radius: 16px; padding: 25px; margin-bottom: 40px; text-align: center; border: 1px solid #fcd34d;">
              <p style="margin: 0 0 10px 0; color: #92400e; font-size: 11px; font-weight: 900; text-transform: uppercase;">Tu PIN de Acceso a Mesa</p>
              <p style="margin: 0; color: #b45309; font-size: 42px; font-weight: 900; letter-spacing: 12px; line-height: 1;">${pin}</p>
              <p style="margin: 15px 0 0 0; color: #92400e; font-size: 12px; font-weight: 600;">⚠️ Mantén este PIN en secreto hasta el día de la votación.</p>
            </div>

            <a href="https://elecciones-sindicales.vercel.app/interventor/login" style="display: block; background-color: #2563eb; color: #ffffff; text-align: center; padding: 18px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">ACCEDER AL ÁREA DE INTERVENTOR</a>
          </div>

          <div style="padding: 20px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 10px; font-weight: 600; text-transform: uppercase;">Sistema de Gestión Electoral · CSIF 2026</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error Resend:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error('Error General:', err);
    return NextResponse.json({ error: 'Error enviando el correo.' }, { status: 500 });
  }
}
