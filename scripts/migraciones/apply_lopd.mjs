import pg from 'pg';
import fs from 'fs';
import path from 'path';

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { Client } = pg;

const CONNECTION_STRING = process.env.DATABASE_URL;

if (!CONNECTION_STRING) {
  console.error('❌ ERROR: La variable de entorno DATABASE_URL no está configurada.');
  process.exit(1);
}

async function applyMigration() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connected!');

    const sqlPath = path.resolve('supabase/migrations/20260427160000_lopd_bajas.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying LOPD migration...');
    await client.query(sql);

    console.log('✅ Migration applied successfully!');
  } catch (err) {
    console.error('❌ Error during migration:', err);
  } finally {
    await client.end().catch(() => {});
  }
}

applyMigration();
