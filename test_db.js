const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  'https://hnzbqgytvwfsxgsyakyc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuemJxZ3l0dndmc3hnc3lha3ljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3Mzg1OCwiZXhwIjoyMDkwNTQ5ODU4fQ.ORFUNE1wc8agelnQmKN-mgiHHMuprb5k9udQZ-MJIWM'
);

async function run() {
    const { data: unidad } = await supabaseAdmin.from('unidades_electorales').select('*').ilike('nombre', '%REINA CATÓLICA%');
    console.log("Unidad:", unidad);
    
    // Also get all provs
    const { data: provs } = await supabaseAdmin.from('provincias').select('id, nombre, ccaa_id');
    const provsMap = new Map();
    provs.forEach(p => provsMap.set(p.id, p));

    if (unidad && unidad.length > 0) {
        console.log("Provincia of unit:", provsMap.get(unidad[0].provincia_id));
    }
}
run();
