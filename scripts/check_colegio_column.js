const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumn() {
  const { data, error } = await supabase
    .from('mesas_electorales')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error al consultar mesas_electorales:", error);
    return;
  }

  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    console.log("Columnas en mesas_electorales:", columns);
    if (columns.includes('colegio')) {
      console.log("✅ La columna 'colegio' existe.");
    } else {
      console.log("❌ La columna 'colegio' NO existe.");
    }
  } else {
    console.log("No hay datos en mesas_electorales para verificar columnas.");
  }
}

checkColumn();
