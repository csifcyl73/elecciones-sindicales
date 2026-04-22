/**
 * Script para rellenar tablas maestras (Provincias, Sectores, Órganos).
 */
const SUPABASE_URL = 'https://hnzbqgytvwfsxgsyakyc.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuemJxZ3l0dndmc3hnc3lha3ljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3Mzg1OCwiZXhwIjoyMDkwNTQ5ODU4fQ.ORFUNE1wc8agelnQmKN-mgiHHMuprb5k9udQZ-MJIWM';

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
};

async function postData(path, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify(data),
  });
  if (!res.ok) console.error(`❌ Error en ${path}:`, await res.text());
  else console.log(`✅ ${path} procesada.`);
}

const SECTORES = [
  { nombre: 'AGE' }, { nombre: 'AGCA' }, { nombre: 'Educación' },
  { nombre: 'Sanidad' }, { nombre: 'Justicia' }, { nombre: 'Local' },
  { nombre: 'EPE' }, { nombre: 'Privada' }
];

const ORGANOS = [
  { nombre: 'Junta de Personal' },
  { nombre: 'Comité de Empresa' },
  { nombre: 'Representante de los trabajadores' }
];

const PROVINCIAS = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", "Burgos", "Cáceres", 
  "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "La Coruña", "Cuenca", "Gerona", "Granada", "Guadalajara", 
  "Guipúzcoa", "Huelva", "Huesca", "Islas Baleares", "Jaén", "León", "Lérida", "Lugo", "Madrid", "Málaga", 
  "Murcia", "Navarra", "Orense", "Palencia", "Las Palmas", "Pontevedra", "La Rioja", "Salamanca", "Segovia", "Sevilla", 
  "Soria", "Tarragona", "Santa Cruz de Tenerife", "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza", 
  "Ceuta", "Melilla"
];

async function fillMasters() {
  console.log('--- Iniciando carga de maestros ---');
  await postData('sectores', SECTORES);
  await postData('tipos_organos', ORGANOS);
  await postData('provincias', PROVINCIAS.map(p => ({ nombre: p.toUpperCase() })));
  console.log('--- Fin de carga ---');
}

fillMasters();
