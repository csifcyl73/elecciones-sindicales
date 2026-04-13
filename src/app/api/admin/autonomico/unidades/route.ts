import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const getAdmin = () => createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder')
);

// Devuelve las unidades electorales filtradas por comunidad autónoma
export async function GET(req: NextRequest) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const supabase = getAdmin();
    const comunidad = req.nextUrl.searchParams.get('comunidad');

    if (!comunidad) {
      return NextResponse.json({ error: 'Falta parámetro comunidad' }, { status: 400 });
    }

    // Primero obtenemos el ID de la CCAA
    const { data: ccaaData, error: ccaaError } = await supabase
      .from('ccaa')
      .select('id')
      .ilike('nombre', comunidad)
      .single();

    if (ccaaError || !ccaaData) {
      // Si no se encuentra CCAA exacta, intentar con provincias
      // Buscar provincias cuyo nombre de CCAA coincida
      const { data: provData } = await supabase
        .from('provincias')
        .select('id, ccaa_id, ccaa(nombre)')
        .ilike('ccaa.nombre', `%${comunidad}%`);

      if (!provData || provData.length === 0) {
        return NextResponse.json([]);
      }

      const provinciaIds = provData.map((p: any) => p.id);

      const { data, error } = await supabase
        .from('unidades_electorales')
        .select(`
          *,
          ccaa(nombre),
          provincias(nombre),
          sectores(nombre),
          tipos_organos(nombre),
          proceso:procesos_electorales(nombre),
          mesas_electorales(
            *,
            usuarios(nombre_completo)
          )
        `)
        .in('provincia_id', provinciaIds)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return NextResponse.json(data || []);
    }

    // Si encontramos la CCAA, buscar las provincias de esa CCAA
    const { data: provincias } = await supabase
      .from('provincias')
      .select('id')
      .eq('ccaa_id', ccaaData.id);

    if (!provincias || provincias.length === 0) {
      return NextResponse.json([]);
    }

    const provinciaIds = provincias.map((p: any) => p.id);

    const { data, error } = await supabase
      .from('unidades_electorales')
      .select(`
        *,
        ccaa(nombre),
        provincias(nombre),
        sectores(nombre),
        tipos_organos(nombre),
        proceso:procesos_electorales(nombre),
        mesas_electorales(
          *,
          usuarios(nombre_completo)
        )
      `)
      .in('provincia_id', provinciaIds)
      .order('nombre', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error('Error en API autonomico/unidades:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
