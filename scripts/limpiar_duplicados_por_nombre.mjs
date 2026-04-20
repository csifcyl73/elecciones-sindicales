/**
 * limpiar_duplicados_por_nombre.mjs
 * Consolida todas las unidades electorales que tengan exactamente el mismo NOMBRE,
 * conservando solo la primera (por ID) y redirigiendo todos los datos asociados.
 * Clave de unicidad: nombre (igual que los sindicatos por siglas).
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function run() {
  console.log('Obteniendo todas las unidades electorales...\n');
  const { data: units, error } = await supabase
    .from('unidades_electorales')
    .select('id, nombre, provincia_id, anio')
    .order('id', { ascending: true });

  if (error) { console.error('Error:', error.message); process.exit(1); }

  // Agrupar SOLO por nombre (como un sindicato)
  const groups = {};
  for (const u of units) {
    const k = (u.nombre || '').toUpperCase().trim();
    if (!groups[k]) groups[k] = [];
    groups[k].push(u);
  }

  let totalDups = 0;
  let eliminados = 0;
  let errores = 0;

  for (const nombre in groups) {
    const items = groups[nombre];
    if (items.length <= 1) continue;

    const survivor = items[0];
    const dups = items.slice(1);
    totalDups += dups.length;
    console.log(`DUPLICADO: "${nombre}" (${dups.length} copias) → Superviviente: ${survivor.id}`);

    for (const dup of dups) {
      console.log(`  Fusionando ${dup.id} (provincia: ${dup.provincia_id}, año: ${dup.anio}) ...`);

      // 1. Reasignar mesas_electorales
      const { error: m1 } = await supabase.from('mesas_electorales')
        .update({ unidad_id: survivor.id }).eq('unidad_id', dup.id);
      if (m1) console.log(`    ! mesas: ${m1.message}`);

      // 2. Reasignar resultados_consolidados (sin duplicar, ignorar conflictos)
      const { data: resRows } = await supabase.from('resultados_consolidados')
        .select('*').eq('unidad_id', dup.id);
      if (resRows) {
        for (const r of resRows) {
          await supabase.from('resultados_consolidados').delete().eq('id', r.id);
          delete r.id;
          r.unidad_id = survivor.id;
          await supabase.from('resultados_consolidados').insert(r); // Ignorar conflicto si ya existe
        }
      }

      // 3. Reasignar unidades_sindicatos (ignorar duplicados)
      const { data: uSinds } = await supabase.from('unidades_sindicatos')
        .select('sindicato_id').eq('unidad_id', dup.id);
      if (uSinds) {
        for (const us of uSinds) {
          await supabase.from('unidades_sindicatos').delete()
            .eq('unidad_id', dup.id).eq('sindicato_id', us.sindicato_id);
          await supabase.from('unidades_sindicatos')
            .insert({ unidad_id: survivor.id, sindicato_id: us.sindicato_id });
        }
      }

      // 4. Eliminar el duplicado
      const { error: delErr } = await supabase.from('unidades_electorales')
        .delete().eq('id', dup.id);
      if (delErr) {
        console.log(`    ! Error al eliminar ${dup.id}: ${delErr.message}`);
        errores++;
      } else {
        console.log(`    ✓ Eliminado.`);
        eliminados++;
      }
    }
  }

  console.log(`\n==============================`);
  console.log(`Duplicados detectados: ${totalDups}`);
  console.log(`Eliminados con éxito: ${eliminados}`);
  console.log(`Errores:              ${errores}`);
  console.log(`==============================`);
  process.exit(0);
}

run();
