CREATE TABLE IF NOT EXISTS public.lopd_bajas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    nombre_completo TEXT,
    fecha_solicitud TIMESTAMPTZ DEFAULT now(),
    procesado BOOLEAN DEFAULT TRUE
);

ALTER TABLE public.lopd_bajas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Admins pueden ver bajas LOPD" ON public.lopd_bajas FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND (usuarios.rol IN ('super_nacional', 'super_autonomico', 'gestor')))
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
