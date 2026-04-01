-- Parche de seguridad para tablas maestras en Frankfurt
ALTER TABLE public.provincias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_organos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ccaa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sindicatos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Lectura pública provincias" ON public.provincias FOR SELECT USING (true);
    CREATE POLICY "Lectura pública sectores" ON public.sectores FOR SELECT USING (true);
    CREATE POLICY "Lectura pública organos" ON public.tipos_organos FOR SELECT USING (true);
    CREATE POLICY "Lectura pública ccaa" ON public.ccaa FOR SELECT USING (true);
    CREATE POLICY "Lectura pública sindicatos" ON public.sindicatos FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
