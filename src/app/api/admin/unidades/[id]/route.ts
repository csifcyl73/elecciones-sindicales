import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder')
);

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const { id } = await params;

    if (!id) return NextResponse.json({ error: 'ID de unidad no proporcionado' }, { status: 400 });

    // 1. Borrar votos asociados a las mesas de esta unidad
    // Primero obtenemos las mesas
    const { data: mesas } = await supabaseAdmin
      .from('mesas_electorales')
      .select('id')
      .eq('unidad_electoral_id', id);

    if (mesas && mesas.length > 0) {
      const mesaIds = mesas.map(m => m.id);
      
      // Borrar votos
      await supabaseAdmin
        .from('votos_partidos')
        .delete()
        .in('mesa_electoral_id', mesaIds);
        
      // Borrar mesas
      await supabaseAdmin
        .from('mesas_electorales')
        .delete()
        .eq('unidad_electoral_id', id);
    }
    
    // 2. Finalmente borrar la unidad
    const { error } = await supabaseAdmin
      .from('unidades_electorales')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Unidad eliminada correctamente' });
  } catch (error: any) {
    console.error("Delete unit backend error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
