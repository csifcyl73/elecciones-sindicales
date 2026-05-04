import os
import subprocess
import datetime
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv('.env.local')
load_dotenv('.env.production.local')

# --- CONFIGURACIÓN ---
DB_URL = os.getenv('DATABASE_URL')
# Ruta al ejecutable pg_dump (ajustar si no está en el PATH)
PG_DUMP_PATH = "pg_dump" 

# Directorio de destino del backup (puedes apuntar a tu NAS de QNAP aquí)
# Ejemplo: "Z:/Backups_Elecciones" o "\\\\QNAP-NAS\\Backups"
BACKUP_DIR = os.getenv('BACKUP_DIR', 'backups_db') 

def run_backup():
    if not DB_URL:
        print("❌ Error: DATABASE_URL no encontrada en el archivo .env")
        return

    # Crear directorio de backup si no existe
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        print(f"📁 Creado directorio: {BACKUP_DIR}")

    # Nombre del archivo con marca de tiempo
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"supabase_backup_{timestamp}.sql"
    filepath = os.path.join(BACKUP_DIR, filename)

    print(f"🚀 Iniciando backup de Supabase...")
    
    try:
        # Comando pg_dump
        # Usamos --no-owner y --no-privileges para facilitar la restauración en otros entornos
        command = [
            PG_DUMP_PATH,
            DB_URL,
            "-f", filepath,
            "--no-owner",
            "--no-privileges",
            "-v"
        ]

        # Ejecutar proceso
        process = subprocess.run(command, check=True, capture_output=True, text=True)
        
        print(f"✅ Backup completado con éxito: {filepath}")
        
        # Verificar tamaño del archivo
        filesize = os.path.getsize(filepath) / (1024 * 1024)
        print(f"📊 Tamaño del archivo: {filesize:.2f} MB")

    except subprocess.CalledProcessError as e:
        print(f"❌ Error al ejecutar pg_dump: {e}")
        print(f"Detalle: {e.stderr}")
    except FileNotFoundError:
        print(f"❌ Error: No se encontró 'pg_dump'. Asegúrate de tener PostgreSQL instalado y en el PATH.")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    run_backup()
