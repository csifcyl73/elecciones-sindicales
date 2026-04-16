require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

async function runMigration() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false // Necesario para Supabase
    }
  });

  try {
    await client.connect();
    console.log('--- Iniciando actualización de base de datos ---');

    // 1. Añadir columna es_federacion
    await client.query(`
      ALTER TABLE public.sindicatos 
      ADD COLUMN IF NOT EXISTS es_federacion BOOLEAN DEFAULT FALSE;
    `);
    console.log('- Columna "es_federacion" asegurada.');

    // 2. Añadir columna federacion_id
    await client.query(`
      ALTER TABLE public.sindicatos 
      ADD COLUMN IF NOT EXISTS federacion_id INT REFERENCES public.sindicatos(id) ON DELETE SET NULL;
    `);
    console.log('- Columna "federacion_id" asegurada.');

    console.log('--- Proceso finalizado con éxito ---');
  } catch (err) {
    console.error('Error durante la migración:', err);
  } finally {
    await client.end();
  }
}

runMigration();
