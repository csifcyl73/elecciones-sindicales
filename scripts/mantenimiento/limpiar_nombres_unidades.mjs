import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function run() {
  console.log('Cargando provincias...');
  const { data: provincias, error: errProv } = await supabase.from('provincias').select('nombre');
  if (errProv) throw errProv;

  const provNamesList = provincias.map(p => p.nombre.toLowerCase().trim());
  // Algunas provincias como "MADRID (COMUNIDAD DE)" o "ASTURIAS (PRINCIPADO DE)" se pueden cruzar
  // Extraemos la primera palabra clave o la base para un match más laxo.
  const isProv = (val) => {
    const vTrim = val.toLowerCase().trim();
    if (provNamesList.includes(vTrim)) return true;
    for (const p of provNamesList) {
       if (p === vTrim || p.startsWith(vTrim + " (")) return true;
    }
    // Hardcode comunes que a veces se escriben diferente (ej: ALICANTE en vez de ALACANT)
    const aliases = ['alicante', 'castellon', 'valencia', 'la coruña', 'coruña', 'vizcaya', 'guipuzcoa', 'murcia', 'madrid', 'ceuta', 'melilla', 'baleares', 'palmas', 'tenerife'];
    if (aliases.some(a => vTrim.includes(a))) return true;
    
    return false;
  };

  console.log('Cargando unidades electorales...');
  const { data: unidades, error: errUni } = await supabase.from('unidades_electorales').select('id, nombre');
  if (errUni) throw errUni;

  let actualizados = 0;

  for (const u of unidades) {
    let original = (u.nombre || '').trim();
    let modificado = original;

    // 1. Limpiar sufijo de provincia entre paréntesis al final
    const match = modificado.match(/\s*\(([^)]+)\)$/);
    if (match) {
        const contenido = match[1];
        if (isProv(contenido) || original.includes('AEAT')) {
            modificado = modificado.replace(/\s*\([^)]+\)$/, '').trim();
        }
    }

    // 2. Aplicar regla solicitada textualmente por el usuario: "COMITÉ DE EMPRESA AEAT" -> "COMITÉ DE EMPRESA DE AEAT"
    // Lo hacemos genérico (agregar el DE)
    if (modificado.toUpperCase().includes('COMITÉ DE EMPRESA AEAT') || modificado.toUpperCase().includes('COMITE DE EMPRESA AEAT')) {
        modificado = modificado.replace(/COMIT[EÉ] DE EMPRESA AEAT/i, 'COMITÉ DE EMPRESA DE AEAT');
    }

    if (modificado !== original) {
        console.log(`Renombrando: "${original}"  -->  "${modificado}"`);
        const { error: errUpd } = await supabase
          .from('unidades_electorales')
          .update({ nombre: modificado })
          .eq('id', u.id);
        
        if (errUpd) console.error(" Error:", errUpd.message);
        else actualizados++;
    }
  }

  console.log(`\nProceso completado. ${actualizados} unidades actualizadas.`);
  process.exit(0);
}

run();
