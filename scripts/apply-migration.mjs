import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const CONNECTION_STRING = "postgresql://postgres:_3x%2A3mffrhu%235BT@db.wzorazeafxxaopkvieow.supabase.co:5432/postgres";

async function applyMigration() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
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
      const ipv6String = "postgresql://postgres:_3x%2A3mffrhu%235BT@[2a05:d01c:30c:9d2d:871:334a:b16c:914b]:5432/postgres";
      const clientV6 = new Client({ connectionString: ipv6String });
      try {
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
