import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createAdmin() {
  const email = 'admin@csif.es';
  const password = 'Admin1234';

  console.log(`--- Creando administrador nacional en Frankfurt ---`);
  
  // 1. Crear usuario en Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { role: 'super_nacional' }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
        console.log('⚠ El usuario ya existe en Auth. Reintentando asociación en tabla pública...');
    } else {
        console.error('❌ Error en Auth:', authError.message);
        return;
    }
  }

  const userId = authData?.user?.id;
  if (!userId) {
     // Si ya existía, intentamos buscarlo para asegurar que está en la tabla pública
     const { data: existingUser } = await supabase.from('usuarios').select('id').eq('email', email).single();
     if (existingUser) {
        console.log('✅ El usuario ya está correctamente registrado y configurado.');
        return;
     }
  }

  // 2. Crear perfil en public.usuarios
  if (userId) {
      const { error: profileError } = await supabase.from('usuarios').upsert({
        id: userId,
        email: email,
        nombre_completo: 'ADMINISTRADOR NACIONAL CSIF',
        rol: 'super_nacional'
      });

      if (profileError) {
        console.error('❌ Error al crear perfil público:', profileError.message);
      } else {
        console.log(`✅ ¡Éxito! Administrador nacional '${email}' creado y activado en Frankfurt.`);
      }
  }
}

createAdmin();
