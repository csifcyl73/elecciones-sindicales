import { NextRequest, NextResponse } from 'next/server';
import pg from 'pg';

export async function GET(req: NextRequest) {
  const { Client } = pg;
  // Usamos el Pooler de Supabase que es más resistente a fallos de DNS (Puerto 6543)
  const client = new Client({
    connectionString: "postgresql://postgres:y3JNG7Ci%23BQBjL*@db.hnzbqgytvwfsxgsyakyc.supabase.co:6543/postgres?sslmode=require"
  });

  try {
    await client.connect();
    await client.query(`
      ALTER TABLE public.provincias ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.sectores ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.tipos_organos ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.ccaa ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.sindicatos ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.unidades_sindicatos ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.unidades_electorales ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.mesas_electorales ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Lectura pública provincias" ON public.provincias;
      DROP POLICY IF EXISTS "Lectura pública sectores" ON public.sectores;
      DROP POLICY IF EXISTS "Lectura pública organos" ON public.tipos_organos;
      DROP POLICY IF EXISTS "Lectura pública ccaa" ON public.ccaa;
      
      DROP POLICY IF EXISTS "Lectura pública sindicatos" ON public.sindicatos;
      DROP POLICY IF EXISTS "Insercion publica sindicatos" ON public.sindicatos;

      DROP POLICY IF EXISTS "Lectura unidades_sindicatos" ON public.unidades_sindicatos;
      DROP POLICY IF EXISTS "Insercion unidades_sindicatos" ON public.unidades_sindicatos;
      DROP POLICY IF EXISTS "Borrado unidades_sindicatos" ON public.unidades_sindicatos;

      DROP POLICY IF EXISTS "Lectura unidades_electorales" ON public.unidades_electorales;
      DROP POLICY IF EXISTS "Insercion unidades_electorales" ON public.unidades_electorales;
      DROP POLICY IF EXISTS "Update unidades_electorales" ON public.unidades_electorales;

      DROP POLICY IF EXISTS "Lectura mesas_electorales" ON public.mesas_electorales;
      DROP POLICY IF EXISTS "Insercion mesas_electorales" ON public.mesas_electorales;
      DROP POLICY IF EXISTS "Update mesas_electorales" ON public.mesas_electorales;

      CREATE POLICY "Lectura pública provincias" ON public.provincias FOR SELECT USING (true);
      CREATE POLICY "Lectura pública sectores" ON public.sectores FOR SELECT USING (true);
      CREATE POLICY "Lectura pública organos" ON public.tipos_organos FOR SELECT USING (true);
      CREATE POLICY "Lectura pública ccaa" ON public.ccaa FOR SELECT USING (true);

      CREATE POLICY "Lectura pública sindicatos" ON public.sindicatos FOR SELECT USING (true);
      CREATE POLICY "Insercion publica sindicatos" ON public.sindicatos FOR INSERT WITH CHECK (true);

      CREATE POLICY "Lectura unidades_sindicatos" ON public.unidades_sindicatos FOR SELECT USING (true);
      CREATE POLICY "Insercion unidades_sindicatos" ON public.unidades_sindicatos FOR INSERT WITH CHECK (true);
      CREATE POLICY "Borrado unidades_sindicatos" ON public.unidades_sindicatos FOR DELETE USING (true);

      CREATE POLICY "Lectura unidades_electorales" ON public.unidades_electorales FOR SELECT USING (true);
      CREATE POLICY "Insercion unidades_electorales" ON public.unidades_electorales FOR INSERT WITH CHECK (true);
      CREATE POLICY "Update unidades_electorales" ON public.unidades_electorales FOR UPDATE USING (true);

      CREATE POLICY "Lectura mesas_electorales" ON public.mesas_electorales FOR SELECT USING (true);
      CREATE POLICY "Insercion mesas_electorales" ON public.mesas_electorales FOR INSERT WITH CHECK (true);
      CREATE POLICY "Update mesas_electorales" ON public.mesas_electorales FOR UPDATE USING (true);
    `);
    
    return NextResponse.json({ success: true, message: 'RLS Permissions fixed in Frankfurt!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    await client.end();
  }
}
