/**
 * Script para reparar las credenciales del Administrador Nacional.
 */
const SUPABASE_URL = 'https://wzorazeafxxaopkvieow.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6b3JhemVhZnh4YW9wa3ZpZW93Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDU3ODQxOCwiZXhwIjoyMDkwMTU0NDE4fQ.TMNma9IbzLGGdiUfHruOy4EkMIlAgP-gALWq7K6CHSc';

const EMAIL = 'admin@csif.es';
const PASSWORD = 'Admin1234';

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
};

async function fixAdminCredentials() {
  console.log(`Buscando usuario ${EMAIL} para arreglar credenciales...`);

  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers: HEADERS });
  const listData = await listRes.json();
  const user = listData.users?.find((u) => u.email === EMAIL);

  if (!user) {
    console.log('Usuario no encontrado. Creándolo...');
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST', headers: HEADERS,
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, email_confirm: true, user_metadata: { role: 'admin_nacional' } }),
    });
    const createData = await createRes.json();
    if (createRes.ok) console.log('✅ Usuario administrador creado con rol admin_nacional');
    else console.error('❌ Error al crear:', createData);
  } else {
    console.log('Usuario encontrado. Actualizando password y rol...');
    const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
      method: 'PUT', headers: HEADERS,
      body: JSON.stringify({
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { ...user.user_metadata, role: 'admin_nacional' }
      }),
    });
    const updateData = await updateRes.json();
    if (updateRes.ok) console.log('✅ Credenciales y rol admin_nacional actualizados!');
    else console.error('❌ Error al actualizar:', updateData);
  }
}

fixAdminCredentials();
