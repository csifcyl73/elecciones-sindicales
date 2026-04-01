import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, nombre, pin, unidad } = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'Elecciones Sindicales API <onboarding@resend.dev>', 
      to: [email],
      subject: 'Asignación de Interventor - Elecciones Sindicales',
      text: `Hola ${nombre},\n\nHas sido asignado como interventor en la Unidad Electoral: ${unidad}.\n\nTu PIN seguro de acceso para las votaciones es: ${pin}\n\nGracias,\nEquipo Administración Nacional.`,
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
