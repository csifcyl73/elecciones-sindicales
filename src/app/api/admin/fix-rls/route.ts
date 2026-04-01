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

      DO $$ BEGIN
          CREATE POLICY "Lectura pública provincias" ON public.provincias FOR SELECT USING (true);
          CREATE POLICY "Lectura pública sectores" ON public.sectores FOR SELECT USING (true);
          CREATE POLICY "Lectura pública organos" ON public.tipos_organos FOR SELECT USING (true);
          CREATE POLICY "Lectura pública ccaa" ON public.ccaa FOR SELECT USING (true);
          CREATE POLICY "Lectura pública sindicatos" ON public.sindicatos FOR SELECT USING (true);
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);
    
    return NextResponse.json({ success: true, message: 'RLS Permissions fixed in Frankfurt!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    await client.end();
  }
}
