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
      unidad_id, provincia_id, municipio_id, sector_id, tipo_organo_id, total_delegados, finalCcaaId,
      proceso_electoral_id, anio,
      modo_colegio, del_tecnicos, del_especialistas,
      sindicatosUnicos, mesas 
    } = payload;

    if (!unidad_id) return NextResponse.json({ error: 'Falta ID de unidad' }, { status: 400 });

    // 1. Update Unit
    const updateData: any = {
       provincia_id: provincia_id ? parseInt(provincia_id) : null,
       municipio_id: municipio_id ? (municipio_id === 'NO_PROCEDE' ? null : parseInt(municipio_id)) : null,
       sector_id: sector_id ? parseInt(sector_id) : null,
       tipo_organo_id: parseInt(tipo_organo_id),
       delegados_a_elegir: total_delegados,
       ccaa_id: finalCcaaId ? parseInt(finalCcaaId) : null,
       modo_colegio: modo_colegio || 'unico',
       del_tecnicos: del_tecnicos ? parseInt(del_tecnicos) : 0,
       del_especialistas: del_especialistas ? parseInt(del_especialistas) : 0,
       estado: 'activa'
    };

    // Proceso electoral (nullable UUID or null if NO_PROCEDE / empty)
    if (proceso_electoral_id && proceso_electoral_id !== 'NO_PROCEDE') {
       updateData.proceso_electoral_id = proceso_electoral_id;
    } else {
       updateData.proceso_electoral_id = null;
    }

    // Año (nullable INT)
    if (anio) {
       updateData.anio = parseInt(anio);
    } else {
       updateData.anio = null;
    }

    const { error: saveError } = await supabaseAdmin
      .from('unidades_electorales')
      .update(updateData)
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

    // 3. Update Mesas
    if (mesas && mesas.length > 0) {
        for (const mesa of mesas) {
             let finalNombre = mesa.nombre;
             if (modo_colegio === 'doble') {
                 if (mesa.colegio === 'tecnicos') finalNombre = `[TÉCNICOS] ${mesa.nombre}`;
                 else if (mesa.colegio === 'especialistas') finalNombre = `[ESPECIALISTAS] ${mesa.nombre}`;
             }

             // Limpieza por si ya traía el prefijo
             if (mesa.nombre.toUpperCase().includes('[TÉCNICOS]')) {
                 finalNombre = mesa.nombre; // Ya lo tiene
             } else if (mesa.nombre.toUpperCase().includes('[ESPECIALISTAS]')) {
                 finalNombre = mesa.nombre; // Ya lo tiene
             }

             const { error: mesaErr } = await supabaseAdmin.from('mesas_electorales').upsert({
                 // Si viene un UUID válido de Supabase, deberíamos usarlo, pero si es un Math.random() no.
                 // Como es complicado saberlo, confiamos en la restricción onConflict o insertamos.
                 unidad_id: unidad_id,
                 nombre_identificador: finalNombre,
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
