import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('unidades_electorales')
    .select(`
      *,
      provincias(nombre),
      municipios(nombre),
      sectores(nombre),
      proceso:procesos_electorales(nombre)
    `)
    .limit(1);

  console.log('Error:', error);
  console.log('Data:', data);
}

run();
