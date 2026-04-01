import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runFix() {
  const { Client } = pg;
  // Probando con el usuario estándar 'postgres' sobre el Pooler IPv4
  const client = new Client({
    connectionString: "postgresql://postgres:y3JNG7Ci%23BQBjL*@aws-0-eu-central-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });

  console.log('--- Reparación de Frankfurt (Intento de usuario simple) ---');
  
  try {
    await client.connect();
    console.log('✅ ¡¡CONECTADO!!');
    
    await client.query(`
      ALTER TABLE public.provincias ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.sectores ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.ccaa ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.tipos_organos ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.sindicatos ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "public_read_provincias" ON public.provincias;
      DROP POLICY IF EXISTS "public_read_sectores" ON public.sectores;
      DROP POLICY IF EXISTS "public_read_ccaa" ON public.ccaa;
      DROP POLICY IF EXISTS "public_read_organos" ON public.tipos_organos;
      DROP POLICY IF EXISTS "public_read_sindicatos" ON public.sindicatos;

      CREATE POLICY "public_read_provincias" ON public.provincias FOR SELECT USING (true);
      CREATE POLICY "public_read_sectores" ON public.sectores FOR SELECT USING (true);
      CREATE POLICY "public_read_ccaa" ON public.ccaa FOR SELECT USING (true);
      CREATE POLICY "public_read_organos" ON public.tipos_organos FOR SELECT USING (true);
      CREATE POLICY "public_read_sindicatos" ON public.sindicatos FOR SELECT USING (true);
    `);
    
    console.log('✅ ¡POR FIN! Permisos corregidos.');

  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  } finally {
    await client.end();
  }
}

runFix();
