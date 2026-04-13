const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  'https://hnzbqgytvwfsxgsyakyc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuemJxZ3l0dndmc3hnc3lha3ljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3Mzg1OCwiZXhwIjoyMDkwNTQ5ODU4fQ.ORFUNE1wc8agelnQmKN-mgiHHMuprb5k9udQZ-MJIWM'
);

async function run() {
    const { data: ccaa } = await supabaseAdmin.from('ccaa').select('*').order('id');
    console.log("CCAA:", ccaa);
}
run();
