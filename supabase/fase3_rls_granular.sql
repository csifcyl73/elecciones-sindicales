-- FASE 3: Políticas RLS Granulares Geográficamente

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
