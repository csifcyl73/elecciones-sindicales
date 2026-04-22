import os

SQL_RLS_PATH = '../supabase/fase3_rls_granular.sql'
SQL_AUDIT_PATH = '../supabase/fase3_audit_triggers.sql'

SQL_RLS_CONTENT = """-- FASE 3: Políticas RLS Granulares Geográficamente

-- Para aplicar roles correctamente, debemos usar el jwt claims 
-- Ej: (auth.jwt() -> 'user_metadata' ->> 'role')
-- Ej: (auth.jwt() -> 'user_metadata' ->> 'comunidad')

-- NOTA: Como la app funciona sobre 'service_role' para no romper
-- en el corto plazo, instalamos las políticas para cuando el token sea
-- expuesto directamente o cambiemos el cliente a 'anon' + SSR Cookies.

ALTER TABLE public.unidades_electorales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura autenticada unidades" ON public.unidades_electorales;

CREATE POLICY "Lectura RLS Geografica"
ON public.unidades_electorales
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_nacional') 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'interventor')
  OR 
  (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'super_autonomico' 
    AND 
    (auth.jwt() -> 'user_metadata' ->> 'comunidad') = 
      (SELECT nombre FROM provincias WHERE id = unidades_electorales.provincia_id LIMIT 1) 
      -- Depende del modelo relacional, esto es seguro si la provincia mapea a ccaa en su schema.
  )
);
"""

SQL_AUDIT_CONTENT = """-- FASE 3: Logs de Auditoría (Trazabilidad)

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    tabla_afectada TEXT NOT NULL,
    operacion TEXT NOT NULL,
    registro_id UUID NOT NULL,
    usuario_uid UUID, -- Puede ser null si es el systema/service_role
    datos_antiguos JSONB,
    datos_nuevos JSONB,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Aseguramos que los logs no puedan ser alterados
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nadie puede alterar los logs" ON public.audit_logs FOR ALL USING (false);

-- Función de trigger
CREATE OR REPLACE FUNCTION public.log_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        tabla_afectada,
        operacion,
        registro_id,
        usuario_uid,
        datos_antiguos,
        datos_nuevos
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        auth.uid(), -- Captura el JWT del atacante o adm, o null si ServiceRole
        row_to_json(OLD)::JSONB,
        row_to_json(NEW)::JSONB
    );
    
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adjuntar trigger a 'unidades_electorales'
DROP TRIGGER IF EXISTS trigger_audit_unidades ON public.unidades_electorales;

CREATE TRIGGER trigger_audit_unidades
AFTER INSERT OR UPDATE OR DELETE ON public.unidades_electorales
FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
"""

def generate_sqls():
    os.makedirs(os.path.dirname(SQL_RLS_PATH), exist_ok=True)
    
    with open(SQL_RLS_PATH, 'w', encoding='utf-8') as f:
        f.write(SQL_RLS_CONTENT)
    print(f"Generated Phase 3 RLS Granular Script at: {SQL_RLS_PATH}")
    
    with open(SQL_AUDIT_PATH, 'w', encoding='utf-8') as f:
        f.write(SQL_AUDIT_CONTENT)
    print(f"Generated Phase 3 Audit Triggers Script at: {SQL_AUDIT_PATH}")
    print("WARNING: Apply these via Supabase Dashboard SQL Editor.")

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    generate_sqls()
