const SUPABASE_URL = 'https://hnzbqgytvwfsxgsyakyc.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuemJxZ3l0dndmc3hnc3lha3ljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3Mzg1OCwiZXhwIjoyMDkwNTQ5ODU4fQ.ORFUNE1wc8agelnQmKN-mgiHHMuprb5k9udQZ-MJIWM';

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
};

async function createTestAutonomico() {
  console.log('Creando usuario de prueba: admin.madrid@csif.es ...');

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      email: 'admin.madrid@csif.es',
      password: 'Test1234!',
      email_confirm: true,
      user_metadata: {
        nombre: 'JUAN',
        apellidos: 'GARCIA MARTINEZ',
        comunidad: 'MADRID (COMUNIDAD DE)',
        role: 'super_autonomico',
      },
    }),
  });

  const data = await res.json();
  if (res.ok) {
    console.log('✅ Usuario creado:', data.id);
    console.log('   Email: admin.madrid@csif.es');
    console.log('   Password: Test1234!');
  } else {
    // Si ya existe, actualizar
    if (data.msg?.includes('already') || data.code === 422) {
      console.log('⚠️  Ya existe. Buscando para actualizar...');
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers: HEADERS });
      const listData = await listRes.json();
      const user = listData.users?.find((u) => u.email === 'admin.madrid@csif.es');
      if (user) {
        const upd = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
          method: 'PUT', headers: HEADERS,
          body: JSON.stringify({ password: 'Test1234!', email_confirm: true,
            user_metadata: { nombre:'JUAN', apellidos:'GARCIA MARTINEZ', comunidad:'MADRID (COMUNIDAD DE)', role:'super_autonomico' } }),
        });
        const updData = await upd.json();
        if (upd.ok) console.log('✅ Usuario actualizado. Password: Test1234!');
        else console.error('❌', JSON.stringify(updData));
      }
    } else {
      console.error('❌', JSON.stringify(data));
    }
  }
}
createTestAutonomico();
