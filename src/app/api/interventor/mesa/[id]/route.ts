import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
     const mesa_id = params.id;
     if (!mesa_id) return NextResponse.json({ error: 'ID faltante' }, { status: 400 });

     const supabaseAdmin = getClient();
     
     // Obtenemos todos los datos relevantes
     const { data: mesa, error } = await supabaseAdmin.from('mesas_electorales').select(`
        *,
        unidades_electorales (
           nombre,
           tipo_organo_id,
           provincias (nombre),
           unidades_sindicatos (
              sindicatos (id, siglas, nombre_completo)
           )
        ),
        votos_candidaturas (
           sindicato_id,
           votos_obtenidos
        )
     `).eq('id', mesa_id).single();

     if (error) throw error;
     return NextResponse.json(mesa);
  } catch (err: any) {
     return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
     const mesa_id = params.id;
     const body = await req.json();
     const supabaseAdmin = getClient();

     const toUpdate: any = {
         censo_real: body.censo_real,
         votos_blancos: body.votos_blancos,
         votos_nulos: body.votos_nulos,
         observaciones: body.observaciones,
         estado: 'enviada',
         fecha_envio: new Date().toISOString()
     };

     if (body.acta_url !== undefined) {
         toUpdate.acta_url = body.acta_url;
     }

     const { error: mesaErr } = await supabaseAdmin.from('mesas_electorales').update(toUpdate).eq('id', mesa_id);
     if (mesaErr) throw mesaErr;

     // Guardar votos
     if (body.votos_candidaturas && body.votos_candidaturas.length > 0) {
         const { error: voErr } = await supabaseAdmin.from('votos_candidaturas').upsert(
            body.votos_candidaturas.map((v: any) => ({
               mesa_id: mesa_id,
               sindicato_id: parseInt(v.sindicato_id),
               votos_obtenidos: parseInt(v.votos_obtenidos) || 0
            })),
            { onConflict: 'mesa_id,sindicato_id' }
         );
         if (voErr) throw voErr;
     }

     return NextResponse.json({ success: true });
  } catch(err:any) {
     return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
