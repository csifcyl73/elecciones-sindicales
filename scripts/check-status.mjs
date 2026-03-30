import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('--- Checking Tables ---');
  const { data: tables, error: tError } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public');
  
  if (tError) {
    // Falls back to direct query if pg_tables not accessible via API
    console.log('Could not list tables from API. Trying RPC or direct... (likely no tables yet or permission issue)');
  } else {
    console.log('Tables:', tables);
  }

  // Check auth users
  const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
  if (uError) {
    console.log('Auth check error:', uError);
  } else {
    console.log('Registered users:', users.length);
    users.forEach(u => console.log(`- ${u.email} (${u.user_metadata?.role || 'no role'})`));
  }
}

checkSchema();
