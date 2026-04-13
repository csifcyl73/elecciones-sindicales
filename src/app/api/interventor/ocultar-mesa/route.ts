import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder')
);

export async function POST(req: NextRequest) {
  const { error: authErr } = await requireAuth(['interventor']);
  if (authErr) return authErr;

  try {
    const { mesaId, userId } = await req.json();

    if (!mesaId || !userId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // Verificar que la mesa pertenece al interventor y que la unidad está congelada
    const { data: mesa, error: fetchErr } = await supabaseAdmin
       .from('mesas_electorales')
       .select('id, interventor_id, unidades_electorales(estado)')
       .eq('id', mesaId)
       .single();

    if (fetchErr) throw fetchErr;

    if (!mesa || mesa.interventor_id !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // @ts-ignore
    if (mesa.unidades_electorales?.estado !== 'congelada') {
      return NextResponse.json({ error: 'Solo se pueden ocultar mesas de elecciones bloqueadas' }, { status: 400 });
    }

    // Desvinculamos al interventor de la mesa (los datos de votos, censo, etc. permanecen intactos)
    const { error: updateErr } = await supabaseAdmin
       .from('mesas_electorales')
       .update({ interventor_id: null })
       .eq('id', mesaId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Ocultar mesa error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
