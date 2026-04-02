import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { 
      unidad_id, provincia_id, sector_id, tipo_organo_id, total_delegados, finalCcaaId,
      sindicatosUnicos, mesas 
    } = payload;

    if (!unidad_id) return NextResponse.json({ error: 'Falta ID de unidad' }, { status: 400 });

    // 1. Update Unit
    const { error: saveError } = await supabaseAdmin
      .from('unidades_electorales')
      .update({
         provincia_id: provincia_id ? parseInt(provincia_id) : null,
         sector_id: sector_id ? parseInt(sector_id) : null,
         tipo_organo_id: parseInt(tipo_organo_id),
         delegados_a_elegir: total_delegados,
         ccaa_id: finalCcaaId ? parseInt(finalCcaaId) : null,
         estado: 'activa'
      })
      .eq('id', unidad_id);

    if (saveError) throw saveError;

    // 2. Update Sindicatos
    await supabaseAdmin.from('unidades_sindicatos').delete().eq('unidad_id', unidad_id);
    if (sindicatosUnicos && sindicatosUnicos.length > 0) {
        const { error: sindicatosErr } = await supabaseAdmin.from('unidades_sindicatos').upsert(
            sindicatosUnicos.map((sId: number) => ({
                unidad_id: unidad_id,
                sindicato_id: sId
            })),
            { onConflict: 'unidad_id,sindicato_id' }
        );
        if (sindicatosErr) throw sindicatosErr;
    }

    // 3. Update Mesas y Usuarios(PIN)
    if (mesas && mesas.length > 0) {
        for (const mesa of mesas) {
             await supabaseAdmin.from('usuarios').update({ pin_acceso: mesa.pin }).eq('id', mesa.interventor_id);
             
             const { error: mesaErr } = await supabaseAdmin.from('mesas_electorales').upsert({
                 unidad_id: unidad_id,
                 nombre_identificador: mesa.nombre,
                 interventor_id: mesa.interventor_id,
                 estado: 'pendiente'
             }, { onConflict: 'unidad_id,nombre_identificador' });

             if (mesaErr) throw mesaErr;
        }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save config backend error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
