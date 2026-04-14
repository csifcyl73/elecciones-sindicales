import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) throw new Error('Credenciales faltantes');
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
};

export async function POST(request: Request) {
  const { error: authErr } = await requireAuth(['super_nacional', 'super_autonomico']);
  if (authErr) return authErr;

  try {
    const list = await request.json();
    
    if (!Array.isArray(list)) {
      return NextResponse.json({ error: 'Formato incorrecto. Se esperaba un array de sindicatos.' }, { status: 400 });
    }

    if (list.length === 0) {
      return NextResponse.json({ imported: 0, duplicated: 0 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Obtener duplicados (siglas existentes)
    const { data: existingData, error: extError } = await supabase
      .from('sindicatos')
      .select('siglas');
    
    if (extError) throw extError;

    const existingSiglasSet = new Set(existingData?.map(s => s.siglas.toUpperCase()) || []);

    // 2. Filtrar array entrante para eliminar duplicados de sí mismo y respecto a DB
    const toInsertMap = new Map();
    let duplicatedCount = 0;

    for (const item of list) {
      if (!item.siglas || !item.nombre_completo) continue; // Descartar filas vacías

      const normalizedSigla = item.siglas.trim().toUpperCase();
      const normalizedNombre = item.nombre_completo.trim().toUpperCase();
      
      if (existingSiglasSet.has(normalizedSigla) || toInsertMap.has(normalizedSigla)) {
        duplicatedCount++;
      } else {
        toInsertMap.set(normalizedSigla, {
          siglas: normalizedSigla,
          nombre_completo: normalizedNombre,
          orden_prioridad: 50 // Default
        });
      }
    }

    const arrayToInsert = Array.from(toInsertMap.values());

    if (arrayToInsert.length === 0) {
      return NextResponse.json({ imported: 0, duplicated: duplicatedCount });
    }

    // 3. Obtener el MAX ID actual debido a restricciones constraint sindicatos_pkey
    const { data: maxRecord } = await supabase
      .from('sindicatos')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextId = (maxRecord?.id || 0) + 1;

    // Asignar el ID contiguo
    const finalRecords = arrayToInsert.map(record => ({
      ...record,
      id: nextId++
    }));

    // 4. Inserción Masiva
    const { error: insertError } = await supabase
      .from('sindicatos')
      .insert(finalRecords);

    if (insertError) throw insertError;

    return NextResponse.json({
      imported: finalRecords.length,
      duplicated: duplicatedCount
    });

  } catch (err: any) {
    console.error("Error bulk inserting sindicatos:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
