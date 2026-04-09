import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('mesas_electorales')
    .select(`
      *,
      unidades_electorales (
         nombre,
         tipo_organo_id,
         delegados_a_elegir,
         provincias (nombre)
      )
    `)
    .limit(3);

  console.log('Error:', error);
  console.log('Data:', data);
}

run();
