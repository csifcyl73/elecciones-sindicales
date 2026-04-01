import pg from 'pg';
const { Client } = pg;

const CONNECTION_STRING = `postgresql://postgres:y3JNG7Ci%23BQBjL%2A@[2a05:d014:1c06:5f46:341:ded5:db4f:8f8b]:5432/postgres`;

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
