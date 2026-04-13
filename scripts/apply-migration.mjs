import pg from 'pg';
import fs from 'fs';
import path from 'path';

import 'dotenv/config';

const { Client } = pg;

// IMPORTANTE: Configurar DATABASE_URL en .env.local
// Formato: postgresql://usuario:password@host:puerto/database
const CONNECTION_STRING = process.env.DATABASE_URL;

if (!CONNECTION_STRING) {
  console.error('❌ ERROR: La variable de entorno DATABASE_URL no está configurada.');
  console.error('   Configúrala en .env.local con el formato: postgresql://usuario:password@host:puerto/database');
  process.exit(1);
}

async function applyMigration() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false } // Requerido por Supabase para conexiones directas
  });

  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connected!');

    const sqlPath = path.resolve('supabase/migrations/20260330100000_schema_inicial.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying migration...');
    // Split SQL by double semicolon since some DO blocks or triggers might have single ones?
    // Actually, just execute the whole string if the library supports multiple statements.
    // Client.query in node-sql-client usually supports it.
    await client.query(sql);

    console.log('✅ Migration applied successfully!');
  } catch (err) {
    console.error('❌ Error during migration:', err);
    if (err.message.includes('getaddrinfo')) {
      console.log('TIP: Verifica que DATABASE_URL apunta al host correcto.');
    }
  } finally {
    await client.end().catch(() => {});
  }
}

applyMigration();
