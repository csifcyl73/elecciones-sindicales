const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hnzbqgytvwfsxgsyakyc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuemJxZ3l0dndmc3hnc3lha3ljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3Mzg1OCwiZXhwIjoyMDkwNTQ5ODU4fQ.ORFUNE1wc8agelnQmKN-mgiHHMuprb5k9udQZ-MJIWM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function injectColumn() {
  console.log("Inyectando columna...");
  const { data, error } = await supabase.rpc('execute_sql_query', {
    "query": "ALTER TABLE public.mesas_electorales ADD COLUMN observaciones TEXT;"
  });
  if (error) {
     console.error("Error/Supabase might not have RPC function to execute raw SQL from HTTP. E:", error);
  } else {
     console.log("Ok supabase rpc!");
  }
}

injectColumn();
