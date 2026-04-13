import pg from 'pg';
import 'dotenv/config';
const { Client } = pg;

const CONNECTION_STRING = process.env.DATABASE_URL;
if (!CONNECTION_STRING) {
  console.error('❌ ERROR: Configura DATABASE_URL en .env.local');
  process.exit(1);
}

async function addMunicipio() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to apply DDL...');
    await client.connect();
    
    // Check if column already exists
    const checkSql = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='unidades_electorales' and column_name='municipio_nombre';
    `;
    const checkRes = await client.query(checkSql);
    
    if (checkRes.rows.length === 0) {
       console.log('Adding municipio_nombre column...');
       await client.query('ALTER TABLE public.unidades_electorales ADD COLUMN municipio_nombre TEXT;');
       console.log('Column added successfully!');
    } else {
       console.log('Column already exists!');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end().catch(()=> {});
  }
}

addMunicipio();
