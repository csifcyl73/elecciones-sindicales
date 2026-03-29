const SUPABASE_URL = 'https://wzorazeafxxaopkvieow.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6b3JhemVhZnh4YW9wa3ZpZW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1Nzg0MTgsImV4cCI6MjA5MDE1NDQxOH0.6QU35IzM33zQxxp6fLGu53A0rf2uEl-BxPPzCC7IUzo';

const EMAIL = 'admin@csif.es';
const PASSWORD = 'Admin1234';

async function signUpAdmin() {
  console.log(`Intentando registrar usuario: ${EMAIL}`);

  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Respuesta:', JSON.stringify(data, null, 2));

  if (res.ok && data.id) {
    console.log('\n✅ Usuario creado/existe. ID:', data.id);
  } else if (data.error_description || data.msg || data.message) {
    console.log('\n⚠️  Mensaje:', data.error_description || data.msg || data.message);
  }
}

signUpAdmin();
