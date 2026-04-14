import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder')
);

export async function POST(req: NextRequest) {
  const { error: authErr } = await requireAuth(['interventor']);
  if (authErr) return authErr;

  try {
    const { userId } = await req.json();

    if (!userId) return NextResponse.json({ error: 'Falta ID de usuario' }, { status: 400 });

    const { data, error } = await supabaseAdmin
       .from('mesas_electorales')
       .select(`
          id,
          nombre_identificador,
          estado,
          fecha_envio,
          unidades_electorales (
             nombre,
             estado,
             anio,
             tipo_organo_id,
             delegados_a_elegir,
             provincias (nombre)
          )
       `)
       .eq('interventor_id', userId);

    if (error) throw error;

    // Auto-expiración: ocultar mesas de elecciones congeladas con más de 30 días desde el envío
    const DIAS_EXPIRACION = 30;
    const ahora = new Date();
    const mesasFiltradas = (data || []).filter((m: any) => {
      if (m.unidades_electorales?.estado === 'congelada' && m.fecha_envio) {
        const fechaEnvio = new Date(m.fecha_envio);
        const diasTranscurridos = (ahora.getTime() - fechaEnvio.getTime()) / (1000 * 60 * 60 * 24);
        return diasTranscurridos < DIAS_EXPIRACION;
      }
      return true; // Mesas activas siempre se muestran
    });

    return NextResponse.json(mesasFiltradas);
  } catch (error: any) {
    console.error("Mis mesas API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
