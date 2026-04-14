import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const getAdmin = () => createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder')
);

export async function GET() {
  try {
    const supabase = getAdmin();
    const { data, error } = await supabase
      .from('unidades_electorales')
      .select(`
        *,
        ccaa(nombre),
        provincias(nombre),
        sectores(nombre),
        tipos_organos(nombre)
      `)
      .order('nombre', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
