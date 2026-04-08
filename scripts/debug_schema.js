const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_CONNECTION_STRING,
  });

  try {
    await client.connect();
    console.log("Conectado a PostgreSQL/Supabase");

    const tables = ['unidades_electorales', 'mesas_electorales', 'votos_candidaturas'];
    
    for (const table of tables) {
      console.log(`\n--- Definición de ${table} ---`);
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position;
      `, [table]);
      res.rows.forEach(row => {
        console.log(`${row.column_name}: ${row.data_type}`);
      });
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

checkSchema();
