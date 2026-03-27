export type RolUsuario = 'super_nacional' | 'super_autonomico' | 'gestor' | 'interventor' | 'visualizador';
export type EstadoUnidad = 'configuracion' | 'activa' | 'escrutinio' | 'finalizada' | 'congelada';
export type EstadoMesa = 'pendiente' | 'enviada';

export interface CCAA {
  id: number;
  nombre: string;
}

export interface Provincia {
  id: number;
  ccaa_id: number;
  nombre: string;
}

export interface Sector {
  id: number;
  nombre: string;
}

export interface TipoOrgano {
  id: number;
  nombre: string;
}

export interface Sindicato {
  id: number;
  siglas: string;
  nombre_completo: string;
  logo_url: string | null;
  orden_prioridad: number;
}

export interface Usuario {
  id: string; // uuid
  rol: RolUsuario;
  ccaa_id: number | null;
  nombre_completo: string;
  dni: string;
  telefono: string | null;
  email: string | null;
  pin_acceso: string | null;
}

export interface UnidadElectoral {
  id: string; // uuid
  nombre: string;
  ccaa_id: number | null;
  provincia_id: number | null;
  sector_id: number | null;
  tipo_organo_id: number | null;
  delegados_a_elegir: number;
  estado: EstadoUnidad;
}

export interface UnidadSindicato {
  unidad_id: string; // uuid
  sindicato_id: number;
}

export interface MesaElectoral {
  id: string; // uuid
  unidad_id: string | null;
  nombre_identificador: string;
  interventor_id: string | null;
  censo_real: number | null;
  votos_blancos: number;
  votos_nulos: number;
  acta_url: string | null;
  estado: EstadoMesa;
  fecha_envio: string | null;
}

export interface VotosCandidaturas {
  id: string; // uuid
  mesa_id: string | null;
  sindicato_id: number | null;
  votos_obtenidos: number;
}

export interface ResultadosConsolidados {
  unidad_id: string; // uuid
  sindicato_id: number;
  votos_totales: number;
  delegados_directos: number;
  delegados_por_restos: number;
  delegados_totales: number;
  empate_pendiente: boolean;
}

export interface AuditoriaLog {
  id: string; // uuid
  usuario_id: string | null;
  accion: string;
  detalles: Record<string, unknown> | null; // JSONB
  fecha_hora: string;
}
