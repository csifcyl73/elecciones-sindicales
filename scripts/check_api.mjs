import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Starting test...");
  const fakeId = '52154eb9-8d3c-46c6-b8a5-274fa95d964f'; // from our previous run

  try {
    const { data: unidad, error: unidadError } = await supabase
      .from('unidades_electorales')
      .select(`*, provincias(nombre), sectores(nombre), proceso:procesos_electorales(nombre)`)
      .eq('id', fakeId)
      .single();
    if (unidadError) { console.error("Unidad Error:", unidadError); return; }
    console.log("Unidad OK:", unidad.nombre);

    const { data: mesas, error: mesasError } = await supabase
      .from('mesas_electorales')
      .select('*')
      .eq('unidad_id', fakeId);
    if (mesasError) { console.error("Mesas Error:", mesasError); return; }
    console.log("Mesas length:", mesas.length);

    if (mesas.length > 0) {
      const { data: votos, error: votosError } = await supabase
        .from('votos_candidaturas')
        .select(`*, sindicatos(siglas)`)
        .in('mesa_id', mesas.map(m => m.id));
      if (votosError) { console.error("Votos Error:", votosError); return; }
      console.log("Votos OK:", votos.length);
    }

    const { data: consolidados, error: consolidadosError } = await supabase
      .from('resultados_consolidados')
      .select('*, sindicatos(siglas)')
      .eq('unidad_id', fakeId);
    if (consolidadosError) { console.error("Consolidados Error:", consolidadosError); return; }
    console.log("Consolidados OK:", consolidados.length);

  } catch (err) {
    console.error("General Error:", err);
  }
}

run();
