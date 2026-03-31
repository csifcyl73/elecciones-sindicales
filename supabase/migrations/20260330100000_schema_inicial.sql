-- Estructura de base de datos para el Sistema de Elecciones Sindicales - CSIF

-- Tipos ENUM (Opcional, pero recomendado para integridad)
DO $$ BEGIN
    CREATE TYPE rol_usuario AS ENUM ('super_nacional', 'super_autonomico', 'gestor', 'interventor', 'visualizador');
    CREATE TYPE estado_unidad AS ENUM ('configuracion', 'activa', 'escrutinio', 'finalizada', 'congelada');
    CREATE TYPE estado_mesa AS ENUM ('pendiente', 'enviada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Tablas Maestras
CREATE TABLE IF NOT EXISTS public.ccaa (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.provincias (
    id SERIAL PRIMARY KEY,
    ccaa_id INT REFERENCES public.ccaa(id),
    nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.sectores (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.tipos_organos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.sindicatos (
    id SERIAL PRIMARY KEY,
    siglas TEXT NOT NULL UNIQUE,
    nombre_completo TEXT NOT NULL,
    logo_url TEXT,
    orden_prioridad INT DEFAULT 0
);

-- 2. Usuarios del sistema
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    rol rol_usuario NOT NULL,
    ccaa_id INT REFERENCES public.ccaa(id),
    nombre_completo TEXT NOT NULL,
    dni TEXT NULL, -- Opcional para cumplimiento RGPD según decisión del usuario
    telefono TEXT,
    email TEXT UNIQUE,
    pin_acceso TEXT -- Para acceso de interventores en mesa
);

-- 3. Unidades Electorales
CREATE TABLE IF NOT EXISTS public.unidades_electorales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    ccaa_id INT REFERENCES public.ccaa(id),
    provincia_id INT REFERENCES public.provincias(id),
    sector_id INT REFERENCES public.sectores(id),
    tipo_organo_id INT REFERENCES public.tipos_organos(id),
    delegados_a_elegir INT NOT NULL DEFAULT 1,
    estado estado_unidad NOT NULL DEFAULT 'configuracion'
);

-- Relación N a N Unidades Electorales <-> Sindicatos que se presentan
CREATE TABLE IF NOT EXISTS public.unidades_sindicatos (
    unidad_id UUID REFERENCES public.unidades_electorales(id) ON DELETE CASCADE,
    sindicato_id INT REFERENCES public.sindicatos(id) ON DELETE CASCADE,
    PRIMARY KEY (unidad_id, sindicato_id)
);

-- 4. Mesas Electorales
CREATE TABLE IF NOT EXISTS public.mesas_electorales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidad_id UUID REFERENCES public.unidades_electorales(id) ON DELETE CASCADE,
    nombre_identificador TEXT NOT NULL,
    interventor_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    censo_real INT,
    votos_blancos INT DEFAULT 0,
    votos_nulos INT DEFAULT 0,
    acta_url TEXT,
    estado estado_mesa NOT NULL DEFAULT 'pendiente',
    fecha_envio TIMESTAMPTZ,
    UNIQUE (unidad_id, nombre_identificador)
);

-- Votos por cada candidatura en cada mesa
CREATE TABLE IF NOT EXISTS public.votos_candidaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mesa_id UUID REFERENCES public.mesas_electorales(id) ON DELETE CASCADE,
    sindicato_id INT REFERENCES public.sindicatos(id) ON DELETE CASCADE,
    votos_obtenidos INT DEFAULT 0 NOT NULL,
    UNIQUE (mesa_id, sindicato_id)
);

-- 5. Resultados Consolidados (Cálculo Proporcional)
CREATE TABLE IF NOT EXISTS public.resultados_consolidados (
    unidad_id UUID REFERENCES public.unidades_electorales(id) ON DELETE CASCADE,
    sindicato_id INT REFERENCES public.sindicatos(id) ON DELETE CASCADE,
    votos_totales INT DEFAULT 0,
    delegados_directos INT DEFAULT 0,
    delegados_por_restos INT DEFAULT 0,
    delegados_totales INT DEFAULT 0,
    empate_pendiente BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (unidad_id, sindicato_id)
);

-- 6. Auditoria
CREATE TABLE IF NOT EXISTS public.auditoria_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    accion TEXT NOT NULL,
    detalles JSONB,
    fecha_hora TIMESTAMPTZ DEFAULT now()
);

-- RLS (Row Level Security) - Ejemplo básico habilitado
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades_electorales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas_electorales ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura para usuarios autenticados
DO $$ BEGIN
    CREATE POLICY "Usuarios pueden leer todos los datos" ON public.usuarios FOR SELECT USING (true);
    CREATE POLICY "Cualquiera puede leer CCAA" ON public.ccaa FOR SELECT USING (true);
    
    -- Políticas para Unidades Electorales
    CREATE POLICY "Permitir lectura de unidades" ON public.unidades_electorales FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Permitir insercion de unidades" ON public.unidades_electorales FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "Permitir actualizacion de unidades" ON public.unidades_electorales FOR UPDATE TO authenticated USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Datos iniciales obligatorios
INSERT INTO public.ccaa (id, nombre) VALUES 
(1, 'ANDALUCÍA'), (2, 'ARAGÓN'), (3, 'ASTURIAS (PRINCIPADO DE)'), (4, 'BALEARES (ISLAS)'),
(5, 'CANARIAS'), (6, 'CANTABRIA'), (7, 'CASTILLA-LA MANCHA'), (8, 'CASTILLA Y LEÓN'),
(9, 'CATALUÑA'), (10, 'COMUNIDAD VALENCIANA'), (11, 'EXTREMADURA'), (12, 'GALICIA'),
(13, 'LA RIOJA'), (14, 'MADRID (COMUNIDAD DE)'), (15, 'MURCIA (REGIÓN DE)'), (16, 'NAVARRA (COMUNIDAD FORAL DE)'),
(17, 'PAÍS VASCO'), (18, 'CEUTA (CIUDAD AUTÓNOMA DE)'), (19, 'MELILLA (CIUDAD AUTÓNOMA DE)')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.sindicatos (id, siglas, nombre_completo, orden_prioridad) VALUES 
(1, 'CSIF', 'Central Sindical Independiente y de Funcionarios', 1),
(2, 'UGT', 'Unión General de Trabajadores', 2),
(3, 'CCOO', 'Comisiones Obreras', 3),
(4, 'USO', 'Unión Sindical Obrera', 4),
(5, 'OTROS', 'Otras Candidaturas', 99)
ON CONFLICT (siglas) DO NOTHING;
