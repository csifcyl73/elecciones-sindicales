-- FASE 3: Logs de Auditoría (Trazabilidad)

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
