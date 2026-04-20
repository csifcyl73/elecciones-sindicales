import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Faltan credenciales Supabase");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function deduplicar() {
  console.log("Obteniendo todas las unidades electorales...");
  const { data: units, error } = await supabase
    .from('unidades_electorales')
    .select('id, nombre, provincia_id, anio')
    .order('id', { ascending: true });

  if (error) {
    console.error("Error al obtener unidades:", error);
    return;
  }

  const groups = {};
  for (const u of units) {
    const k = `${(u.nombre || '').toUpperCase()}_${u.provincia_id}`;
    if (!groups[k]) groups[k] = [];
    groups[k].push(u);
  }

  let totalDuplicados = 0;
  let eliminados = 0;

  for (const k in groups) {
    const groupItems = groups[k];
    if (groupItems.length > 1) {
      const survivor = groupItems[0];
      const duplicates = groupItems.slice(1);
      
      console.log(`\nGrupo duplicado detectado: ${k} (${duplicates.length} duplicados)`);
      totalDuplicados += duplicates.length;

      for (const dup of duplicates) {
        console.log(` Procesando duplicado ${dup.id} (Año: ${dup.anio}) -> Superviviente ${survivor.id}`);

        // 1. Move mesas
        await supabase.from('mesas_electorales').update({ unidad_id: survivor.id }).eq('unidad_id', dup.id);
        
        // 2. Move resultados_consolidados
        const { data: resultados } = await supabase.from('resultados_consolidados').select('*').eq('unidad_id', dup.id);
        if (resultados && resultados.length > 0) {
           for (const res of resultados) {
               await supabase.from('resultados_consolidados').delete().eq('id', res.id);
               const oldId = res.id;
               delete res.id;
               res.unidad_id = survivor.id;
               
               const { error: insErr } = await supabase.from('resultados_consolidados').insert(res);
               if (insErr) {
                 // Posible PK conflict o ya existía, está bien, era redundante
                 console.log(`   - Resultado ignorado por conflicto al mover (Sindicato ${res.sindicato_id})`);
               }
           }
        }

        // 3. Move unidades_sindicatos
        const { data: unsind } = await supabase.from('unidades_sindicatos').select('*').eq('unidad_id', dup.id);
        if (unsind && unsind.length > 0) {
           for (const us of unsind) {
               await supabase.from('unidades_sindicatos').delete().eq('unidad_id', us.unidad_id).eq('sindicato_id', us.sindicato_id);
               const { error: usErr } = await supabase.from('unidades_sindicatos').insert({ unidad_id: survivor.id, sindicato_id: us.sindicato_id });
               // Ignorar si falla
           }
        }

        // 4. Update the survivor's anio if needed (to latest anio)
        if (dup.anio && (!survivor.anio || dup.anio > survivor.anio)) {
            await supabase.from('unidades_electorales').update({ anio: dup.anio }).eq('id', survivor.id);
            survivor.anio = dup.anio;
            console.log(`   - Año de superviviente actualizado a ${dup.anio}`);
        }

        // 5. DELETE the duplicate
        const { error: delErr } = await supabase.from('unidades_electorales').delete().eq('id', dup.id);
        if (delErr) {
            console.error(`   - ! Error al eliminar duplicado ${dup.id}:`, delErr.message);
        } else {
            console.log(`   - Duplicado eliminado: ${dup.id}`);
            eliminados++;
        }
      }
    }
  }

  console.log(`\nOPERACIÓN TERMINADA. Total duplicados detectados: ${totalDuplicados}. Eliminados exitosamente: ${eliminados}.`);
  process.exit(0);
}

deduplicar();
