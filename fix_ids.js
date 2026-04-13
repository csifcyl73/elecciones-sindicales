const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  'https://hnzbqgytvwfsxgsyakyc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuemJxZ3l0dndmc3hnc3lha3ljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3Mzg1OCwiZXhwIjoyMDkwNTQ5ODU4fQ.ORFUNE1wc8agelnQmKN-mgiHHMuprb5k9udQZ-MJIWM'
);

// Map of provincia id to ccaa id
const provToCcaa = {
  1: 17, // ÁLAVA -> PAÍS VASCO
  2: 7, // ALBACETE -> CASTILLA-LA MANCHA
  3: 10, // ALICANTE -> COMUNIDAD VALENCIANA
  4: 1, // ALMERÍA -> ANDALUCÍA
  5: 3, // ASTURIAS -> ASTURIAS
  6: 8, // ÁVILA -> CASTILLA Y LEÓN
  7: 11, // BADAJOZ -> EXTREMADURA
  8: 9, // BARCELONA -> CATALUÑA
  9: 8, // BURGOS -> CASTILLA Y LEÓN
  10: 11, // CÁCERES -> EXTREMADURA
  11: 1, // CÁDIZ -> ANDALUCÍA
  12: 6, // CANTABRIA -> CANTABRIA
  13: 10, // CASTELLÓN -> COMUNIDAD VALENCIANA
  14: 7, // CIUDAD REAL -> CASTILLA-LA MANCHA
  15: 1, // CÓRDOBA -> ANDALUCÍA
  16: 12, // LA CORUÑA -> GALICIA
  17: 7, // CUENCA -> CASTILLA-LA MANCHA
  18: 9, // GERONA -> CATALUÑA
  19: 1, // GRANADA -> ANDALUCÍA
  20: 7, // GUADALAJARA -> CASTILLA-LA MANCHA
  21: 17, // GUIPÚZCOA -> PAÍS VASCO
  22: 1, // HUELVA -> ANDALUCÍA
  23: 2, // HUESCA -> ARAGÓN
  24: 4, // ISLAS BALEARES -> BALEARES
  25: 1, // JAÉN -> ANDALUCÍA
  26: 8, // LEÓN -> CASTILLA Y LEÓN
  27: 9, // LÉRIDA -> CATALUÑA
  28: 12, // LUGO -> GALICIA
  29: 14, // MADRID -> MADRID
  30: 1, // MÁLAGA -> ANDALUCÍA
  31: 15, // MURCIA -> MURCIA
  32: 16, // NAVARRA -> NAVARRA
  33: 12, // ORENSE -> GALICIA
  34: 8, // PALENCIA -> CASTILLA Y LEÓN
  35: 5, // LAS PALMAS -> CANARIAS
  36: 12, // PONTEVEDRA -> GALICIA
  37: 13, // LA RIOJA -> LA RIOJA
  38: 8, // SALAMANCA -> CASTILLA Y LEÓN
  39: 8, // SEGOVIA -> CASTILLA Y LEÓN
  40: 1, // SEVILLA -> ANDALUCÍA
  41: 8, // SORIA -> CASTILLA Y LEÓN
  42: 9, // TARRAGONA -> CATALUÑA
  43: 5, // SANTA CRUZ DE TENERIFE -> CANARIAS
  44: 2, // TERUEL -> ARAGÓN
  45: 7, // TOLEDO -> CASTILLA-LA MANCHA
  46: 10, // VALENCIA -> COMUNIDAD VALENCIANA
  47: 8, // VALLADOLID -> CASTILLA Y LEÓN
  48: 17, // VIZCAYA -> PAÍS VASCO
  49: 8, // ZAMORA -> CASTILLA Y LEÓN
  50: 2, // ZARAGOZA -> ARAGÓN
  51: 18, // CEUTA -> CEUTA
  52: 19  // MELILLA -> MELILLA
};

async function fixProvsAndUnits() {
  // Update all provincias with their corresponding ccaa_id
  for (const [provId, ccaaId] of Object.entries(provToCcaa)) {
    const { error } = await supabaseAdmin.from('provincias').update({ ccaa_id: ccaaId }).eq('id', provId);
    if (error) {
      console.error(`Error updating prov ${provId}:`, error);
    }
  }

  // Then update all unidades_electorales that have null ccaa_id but not null provincia_id
  const { data: units } = await supabaseAdmin.from('unidades_electorales').select('id, provincia_id').is('ccaa_id', null).not('provincia_id', 'is', null);
  for (const unit of units) {
     const ccaaId = provToCcaa[unit.provincia_id];
     if (ccaaId) {
         const { error } = await supabaseAdmin.from('unidades_electorales').update({ ccaa_id: ccaaId }).eq('id', unit.id);
         if (error) {
             console.error(`Error updating unit ${unit.id}:`, error);
         } else {
             console.log(`Updated unit ${unit.id} with ccaa_id ${ccaaId}`);
         }
     }
  }
}

fixProvsAndUnits();
