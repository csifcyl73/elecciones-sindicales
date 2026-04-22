import os

SQL_PATH = '../supabase/fase2_rls.sql'

SQL_CONTENT = """-- Fase 2 Auditoría de Seguridad: RLS Strict
-- Estas políticas exigen autenticación real (auth.uid()) en lugar de USING(true)
-- IMPORTANTE: La Service Role Key sigue saltándose el RLS.

-- Políticas estrictas para tabla 'usuarios'
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura publica usuarios" ON public.usuarios;

-- Ejemplo: Los admins autonomicos solo ven usuarios de su CCAA, pero 
-- como medida inicial requerimos al menos que estén autenticados
CREATE POLICY "Lectura autenticada usuarios" 
ON public.usuarios 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Políticas estrictas para tabla 'unidades_electorales'
ALTER TABLE public.unidades_electorales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura publica unidades" ON public.unidades_electorales;

CREATE POLICY "Lectura autenticada unidades" 
ON public.unidades_electorales 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Para aplicar en terminal: 
-- 1. Ir al panel de Supabase -> SQL Editor
-- 2. Pegar este código y ejecutar (OJO: probar en staging primero)
"""

def generate_sql():
    os.makedirs(os.path.dirname(SQL_PATH), exist_ok=True)
    with open(SQL_PATH, 'w', encoding='utf-8') as f:
        f.write(SQL_CONTENT)
    print(f"Generated RLS SQL migration file at: {SQL_PATH}")
    print("WARNING: Apply these policies manually via Supabase Dashboard to avoid catastrophic failure.")

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    generate_sql()
