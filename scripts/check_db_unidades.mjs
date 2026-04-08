import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUnidades() {
    const { data, count, error } = await supabase
        .from('unidades_electorales')
        .select('*', { count: 'exact' });
    
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total Unidades:', count);
        console.log('Sample Data:', data.slice(0, 3));
    }
}

checkUnidades();
