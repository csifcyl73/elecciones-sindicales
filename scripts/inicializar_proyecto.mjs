import { execSync } from 'child_process';
import { existsSync } from 'fs';

function runCommand(command, description) {
  console.log(`--- ${description} ---`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    console.log(`Éxito: ${description}`);
    return true;
  } catch (error) {
    console.error(`Error en ${description}:`);
    return false;
  }
}

async function main() {
  // 1. Instalación de dependencias (npm install)
  if (!runCommand("npm install", "Instalando dependencias de Node.js")) {
    console.error("Cancelando inicialización...");
    return;
  }

  // 2. Verificar existencia de .env.local
  if (existsSync(".env.local")) {
    console.log("--- .env.local verificado ---");
  } else {
    console.error("ERROR: .env.local no encontrado. Por favor configúrelo antes de continuar.");
    return;
  }

  // 3. Aplicar migraciones
  if (existsSync("scripts/apply-migration.mjs")) {
    runCommand("node scripts/apply-migration.mjs", "Aplicando migraciones de base de datos");
  }

  // 4. Poblar datos maestros
  if (existsSync("scripts/populate-masters.mjs")) {
    runCommand("node scripts/populate-masters.mjs", "Poblando tablas maestras");
  }

  // 5. Poblar sindicatos
  if (existsSync("scripts/populate-unions.mjs")) {
    runCommand("node scripts/populate-unions.mjs", "Poblando tabla de sindicatos");
  }

  console.log("\n--- INICIALIZACIÓN COMPLETADA CON ÉXITO ---");
  console.log("Para iniciar el servidor de desarrollo, ejecute: npm run dev");
}

main().catch(console.error);
