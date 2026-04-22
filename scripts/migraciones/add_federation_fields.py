import os
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno del archivo .env.local
load_dotenv(".env.local")

DATABASE_URL = os.getenv("DATABASE_URL")

def update_schema():
    conn = None
    try:
        # Conexión a la base de datos
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        print("--- Iniciando actualización de tabla 'sindicatos' ---")

        # 1. Añadir columna es_federacion
        cur.execute("""
            ALTER TABLE public.sindicatos 
            ADD COLUMN IF NOT EXISTS es_federacion BOOLEAN DEFAULT FALSE;
        """)
        print("- Columna 'es_federacion' añadida o ya existía.")

        # 2. Añadir columna federacion_id (auto-referencia)
        cur.execute("""
            ALTER TABLE public.sindicatos 
            ADD COLUMN IF NOT EXISTS federacion_id INT REFERENCES public.sindicatos(id) ON DELETE SET NULL;
        """)
        print("- Columna 'federacion_id' añadida o ya existía.")

        # Commit de los cambios
        conn.commit()
        print("--- Migración completada con éxito ---")

    except Exception as e:
        print(f"Error durante la ejecución del SQL: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    update_schema()
