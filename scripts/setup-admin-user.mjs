const SUPABASE_URL = 'https://wzorazeafxxaopkvieow.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6b3JhemVhZnh4YW9wa3ZpZW93Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDU3ODQxOCwiZXhwIjoyMDkwMTU0NDE4fQ.TMNma9IbzLGGdiUfHruOy4EkMIlAgP-gALWq7K6CHSc';

const EMAIL = 'admin@csif.es';
const PASSWORD = 'Admin1234';

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
};

async function run() {
  // 1. Buscar si el usuario ya existe
  console.log('🔍 Buscando usuario existente...');
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers: HEADERS });
  const listData = await listRes.json();
  const users = listData.users || [];
  const existing = users.find(u => u.email === EMAIL);

  if (existing) {
    console.log(`✅ Usuario encontrado: ${existing.id}`);
    console.log(`   Email confirmado: ${existing.email_confirmed_at ? 'SÍ' : 'NO'}`);

    // 2. Confirmar email y actualizar contraseña
    console.log('\n🔧 Confirmando email y actualizando contraseña...');
    const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existing.id}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({
        email_confirm: true,
        password: PASSWORD,
      }),
    });
    const updateData = await updateRes.json();
    if (updateRes.ok) {
      console.log('✅ Usuario actualizado correctamente.');
    } else {
      console.error('❌ Error actualizando:', JSON.stringify(updateData));
    }
  } else {
    // 3. Crear usuario nuevo ya confirmado
    console.log('➕ Usuario no encontrado. Creando nuevo...');
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'admin_nacional' },
      }),
    });
    const createData = await createRes.json();
    if (createRes.ok) {
      console.log('✅ Usuario creado:', createData.id);
    } else {
      console.error('❌ Error creando:', JSON.stringify(createData));
    }
  }

  // 4. Verificar login final
  console.log('\n🔑 Verificando login...');
  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginData = await loginRes.json();
  if (loginRes.ok && loginData.access_token) {
    console.log('🎉 LOGIN CORRECTO!');
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Contraseña: ${PASSWORD}`);
  } else {
    console.error('❌ Login fallido:', loginData.error_description || loginData.msg);
  }
}

run();
