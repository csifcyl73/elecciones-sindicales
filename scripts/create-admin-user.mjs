/**
 * Script para crear el usuario administrador nacional en Supabase.
 * 
 * USO:
 *   1. Pon tu SERVICE_ROLE_KEY de Supabase abajo (o como variable de entorno SUPABASE_SERVICE_ROLE_KEY)
 *   2. Ejecuta: node scripts/create-admin-user.mjs
 */

const SUPABASE_URL = 'https://wzorazeafxxaopkvieow.supabase.co';

// Obtén esta clave en: Supabase Dashboard > Settings > API > service_role
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'PEGA_AQUI_TU_SERVICE_ROLE_KEY';

const EMAIL = 'admin@csif.es';
const PASSWORD = 'admin';

async function createAdminUser() {
  if (SERVICE_ROLE_KEY === 'PEGA_AQUI_TU_SERVICE_ROLE_KEY') {
    console.error('❌ ERROR: Debes poner tu SUPABASE_SERVICE_ROLE_KEY en el script o como variable de entorno.');
    console.error('   La encuentras en: Supabase Dashboard → Settings → API → service_role');
    process.exit(1);
  }

  console.log(`🔑 Creando usuario: ${EMAIL} ...`);

  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        role: 'admin_nacional',
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Error al crear el usuario:', JSON.stringify(data, null, 2));
    
    // Si ya existe, intentar actualizar la contraseña
    if (data.msg?.includes('already been registered') || data.code === 'email_exists') {
      console.log('\n⚠️  El usuario ya existe. Intentando actualizar la contraseña...');
      await updatePassword(data);
    }
  } else {
    console.log('✅ Usuario creado correctamente!');
    console.log('   Email:', data.email);
    console.log('   ID:', data.id);
    console.log('   Email confirmado:', data.email_confirmed_at ? 'Sí' : 'No');
    console.log('\n🎉 Ya puedes iniciar sesión con:');
    console.log('   Email:', EMAIL);
    console.log('   Contraseña:', PASSWORD);
  }
}

async function updatePassword() {
  // Para actualizar la contraseña necesitamos el ID del usuario
  // Primero obtenemos la lista de usuarios
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(EMAIL)}`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });

  const listData = await listRes.json();
  const user = listData.users?.[0];

  if (!user) {
    console.error('❌ No se pudo encontrar el usuario para actualizar.');
    return;
  }

  const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      password: PASSWORD,
      email_confirm: true,
    }),
  });

  const updateData = await updateRes.json();

  if (updateRes.ok) {
    console.log('✅ Contraseña actualizada correctamente!');
    console.log('\n🎉 Ya puedes iniciar sesión con:');
    console.log('   Email:', EMAIL);
    console.log('   Contraseña:', PASSWORD);
  } else {
    console.error('❌ Error al actualizar contraseña:', JSON.stringify(updateData, null, 2));
  }
}

createAdminUser();
