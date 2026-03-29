const SUPABASE_URL = 'https://wzorazeafxxaopkvieow.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6b3JhemVhZnh4YW9wa3ZpZW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1Nzg0MTgsImV4cCI6MjA5MDE1NDQxOH0.6QU35IzM33zQxxp6fLGu53A0rf2uEl-BxPPzCC7IUzo';

async function testLogin() {
  console.log('Probando login con admin@csif.es / Admin1234 ...');
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ email: 'admin@csif.es', password: 'Admin1234' }),
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log(JSON.stringify(data, null, 2));
}
testLogin();
