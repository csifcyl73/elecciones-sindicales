import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    console.error('❌ Faltan credenciales: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function main() {
    try {
        console.log('Conectando a Supabase Auth por HTTPS...');
        const rootEmail = 'root@csif.es';
        const rootPassword = 'CSIF.root.2026!'; // Contraseña de prueba inicial

        const { data: searchData, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
        if (searchError) throw searchError;
        
        let rootUser = searchData.users.find(u => u.email === rootEmail);

        if (rootUser) {
            console.log('⚠️ El usuario Root ya existe en Auth. Actualizando clave y permisos...');
            const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(rootUser.id, {
                user_metadata: { role: 'propietario_sistema' },
                password: rootPassword
            });
            if (updErr) throw updErr;
            console.log('✅ Permisos Root actualizados.');
        } else {
            console.log(`Creando usuario Root en Auth: ${rootEmail}...`);
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email: rootEmail,
                password: rootPassword,
                email_confirm: true,
                user_metadata: { role: 'propietario_sistema' }
            });
            if (error) throw error;
            rootUser = data.user;
            console.log('✅ Usuario Root creado.');
        }

        console.log('\n--- CUENTA ROOT CONFIGURADA CON ÉXITO ---');
        console.log(`👤 Email de acceso   : ${rootEmail}`);
        console.log(`🔑 Contraseña inicial: ${rootPassword}`);
        console.log('Puedes acceder a tu nuevo panel a través de: /root');

    } catch (e) {
        console.error('❌ Error configurando Root:', e);
    }
}

main();
