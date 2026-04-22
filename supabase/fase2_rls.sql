-- Fase 2 Auditoría de Seguridad: RLS Strict
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
