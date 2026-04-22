import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { email, nombre, pin, unidad } = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'Elecciones Sindicales API <onboarding@resend.dev>', 
      to: [email],
      subject: 'Asignación de Interventor - Elecciones Sindicales',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
          <p>Hola ${nombre},</p>
          <p>Has sido asignado como interventor en la Unidad Electoral: <strong>${unidad}</strong>.</p>
          <p>Puedes acceder ya a tu panel de control utilizando tus credenciales vigentes (email corporativo y contraseña de autenticación).</p>
          <br/>
          <p>Gracias,<br/>Equipo Administración Nacional.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 40px; margin-bottom: 20px;" />
          <div style="font-size: 9px; color: #6b7280; line-height: 1.5; text-align: justify;">
            <strong>INFORMACIÓN BÁSICA SOBRE PROTECCIÓN DE DATOS (RGPD Y LOPDGDD):</strong><br/>
            <strong>Responsable:</strong> El Sindicato u Organización emisora de las credenciales.<br/>
            <strong>Finalidad:</strong> Gestión organizativa de elecciones sindicales y provisión de accesos de auditoría de mesas.<br/>
            <strong>Legitimación:</strong> Cumplimiento de obligaciones legales aplicables en materia sindical (Art. 6.1.c RGPD).<br/>
            <strong>Destinatarios:</strong> No se prevén comunicaciones de datos, salvo previsión legal.<br/>
            <strong>Tus Derechos:</strong> Puedes ejercer tus derechos ARSOL (Acceso, Rectificación, Supresión, Oposición y Limitación) dirigiendo una solicitud formal al Responsable de Tratamiento.<br/>
            <em>Este mensaje es estrictamente confidencial. Si lo has recibido por error, bórralo de inmediato.</em>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
