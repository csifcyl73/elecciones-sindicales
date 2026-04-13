const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  'https://hnzbqgytvwfsxgsyakyc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuemJxZ3l0dndmc3hnc3lha3ljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3Mzg1OCwiZXhwIjoyMDkwNTQ5ODU4fQ.ORFUNE1wc8agelnQmKN-mgiHHMuprb5k9udQZ-MJIWM'
);

const provToCcaa = {
  1: 17, // ÁLAVA -> PAÍS VASCO
  2: 7, // ALBACETE -> CASTILLA-LA MANCHA
  3: 10, // ALICANTE -> COMUNIDAD VALENCIANA
  4: 1, // ALMERÍA -> ANDALUCÍA
  5: 8, // ÁVILA -> CASTILLA Y LEÓN
  6: 11, // BADAJOZ -> EXTREMADURA (wait, Badajoz is 6? Let's check IDs in DB)
  7: 4, // BALEARES? Wait, the IDs were alphabetical by name.
};

async function checkIds() {
  const { data: provs } = await supabaseAdmin.from('provincias').select('id, nombre').order('id');
  console.log(provs.map(p => `${p.id}: ${p.nombre}`));
}

checkIds();
