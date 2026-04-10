import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Manual parsing of .env.local because it might not be a standard .env
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  console.log('Intentando añadir columna categoria_personal a unidades_electorales...');
  
  // Como no podemos ejecutar SQL directo fácilmente, intentamos un update a un ID inexistente
  // con la columna nueva. Si falla con "column does not exist", confirmamos el problema.
  const { error } = await supabase
    .from('unidades_electorales')
    .update({ categoria_personal: 'NULL' })
    .eq('id', '00000000-0000-0000-0000-000000000000');

  if (error && error.message.includes('column "categoria_personal" of relation "unidades_electorales" does not exist')) {
    console.log('La columna NO existe. Intentando añadirla vía RPC si existe exec_sql...');
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE unidades_electorales ADD COLUMN categoria_personal TEXT;' });
    if (rpcError) {
      console.error('No se pudo añadir automáticamente:', rpcError.message);
      console.log('POR FAVOR, AÑADE MANUALMENTE LA COLUMNA "categoria_personal" (TEXT, NULLABLE) EN SUPABASE.');
    } else {
      console.log('¡Columna añadida con éxito!');
    }
  } else if (error) {
    console.error('Error inesperado:', error.message);
  } else {
    console.log('La columna ya existe o el update pasó sin error de esquema.');
  }
}

fix();
