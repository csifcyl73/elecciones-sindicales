import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkAllUnits() {
  try {
    const { data, error } = await supabase
      .from('unidades_electorales')
      .select(`
        *,
        mesas:mesas_electorales(*),
        sindicatos:unidades_sindicatos(sindicato_id)
      `);

    if (error) {
       console.error('Supabase error:', error);
       process.exit(1);
    }

    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Script panic:', err);
    process.exit(1);
  }
}

checkAllUnits();
