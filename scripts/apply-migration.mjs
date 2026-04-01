import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

// En lugar de un string hardcodeado, usaremos la información del proyecto nuevo
// Password: y3JNG7Ci#BQBjL* -> Codificado: y3JNG7Ci%23BQBjL%2A
const DB_HOST = "aws-0-eu-west-1.pooler.supabase.com"; 
const DB_USER = "postgres.hnzbqgytvwfsxgsyakyc";
const DB_PASS = "y3JNG7Ci%23BQBjL%2A";
const CONNECTION_STRING = `postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:6543/postgres`;

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
      console.log('TIP: Host resolution failed. Attempting with direct IPv6 if available...');
      // Trying with the IPv6 address from nslookup before
      const ipv6String = "postgresql://postgres:y3JNG7Ci%23BQBjL%2A@[2a05:d014:1c06:5f46:341:ded5:db4f:8f8b]:5432/postgres";
      const clientV6 = new Client({ 
        connectionString: ipv6String,
        ssl: { rejectUnauthorized: false }
      });
      try {
        console.log('Attempting IPv6 connection...');
        await clientV6.connect();
        await clientV6.query(fs.readFileSync(path.resolve('supabase/migrations/20260330100000_schema_inicial.sql'), 'utf8'));
        console.log('✅ Migration applied successfully via IPv6!');
      } catch (err2) {
        console.error('❌ IPv6 attempt also failed:', err2);
      }
    }
  } finally {
    await client.end().catch(() => {});
  }
}

applyMigration();
