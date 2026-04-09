"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  Loader2,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Database,
  CalendarRange,
  Building2,
  Layers,
  MapPin,
  FolderOpen
} from 'lucide-react';

export default function VisualizarEleccionesPage() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [procesos, setProcesos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProceso, setExpandedProceso] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Usar las API routes del servidor (service role key, ignora RLS)
      // igual que gestion-unidades y configurar-elecciones
      const [unidadesResp, procesosResp] = await Promise.all([
        fetch('/api/admin/unidades').then(r => r.json()).catch(() => []),
        fetch('/api/admin/procesos-electorales').then(r => r.json()).catch(() => [])
      ]);

      // Filtrar solo unidades con estados relevantes para visualización
      const estadosRelevantes = ['activa', 'escrutinio', 'finalizada', 'congelada'];
      const unidadesFiltradas = Array.isArray(unidadesResp) 
        ? unidadesResp.filter((u: any) => estadosRelevantes.includes(u.estado))
        : [];

      setUnidades(unidadesFiltradas);
      setProcesos(Array.isArray(procesosResp) ? procesosResp : []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = unidades.filter(u => {
    const term = searchTerm.toUpperCase();
    return u.nombre.toUpperCase().includes(term) || 
           (u.provincias?.nombre || '').toUpperCase().includes(term);
  });

  // Agrupar unidades por proceso
  const unidadesPorProceso = (procesoId: string) => filtered.filter(u => u.proceso_electoral_id === procesoId);
  const unidadesSinProceso = filtered.filter(u => {
    if (!u.proceso_electoral_id || u.proceso_electoral_id === 'NO_PROCEDE') return true;
    return !procesos.some(p => p.id === u.proceso_electoral_id);
  });

  const renderUnidadCard = (u: any) => (
    <Link 
      href={`/admin/nacional/visualizar/${u.id}`} 
      key={u.id}
      className="group flex flex-col md:flex-row justify-between md:items-center bg-[#111827]/40 border border-white/5 hover:border-rose-500/30 rounded-[30px] p-5 md:p-6 transition-all hover:bg-[#111827]/80 hover:shadow-[0_10px_40px_rgba(225,29,72,0.1)] gap-4 md:gap-6"
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {u.estado === 'congelada' ? (
             <span className="px-2.5 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
               Resultados Oficiales
             </span>
          ) : (
             <span className="px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
               <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Escrutinio Abierto
             </span>
          )}
          {u.modo_colegio === 'doble' && (
             <span className="px-2.5 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500/70 text-[8px] font-black uppercase tracking-widest">
               Doble Colegio
             </span>
          )}
        </div>
        
        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight truncate leading-tight">{u.nombre}</h3>
        
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="flex items-center gap-1.5 text-white/40 text-[9px] font-bold uppercase tracking-widest">
             <MapPin className="w-3 h-3 text-rose-400/50" /> {u.provincias?.nombre || 'General'}
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-[9px] font-bold uppercase tracking-widest">
             <Building2 className="w-3 h-3 text-rose-400/50" /> {u.sectores?.nombre || 'General'}
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-[9px] font-bold uppercase tracking-widest">
             <Layers className="w-3 h-3 text-rose-400/50" /> {u.tipos_organos?.nombre || 'General'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between md:justify-end gap-6 md:pl-6 md:border-l border-white/5 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
        <div className="text-left md:text-center">
          <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Delegados</p>
          <p className="text-2xl font-black text-rose-400">{u.delegados_a_elegir}</p>
        </div>
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-rose-500 transition-colors">
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white/30 group-hover:text-white transition-colors" />
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#0a101f] text-white p-4 md:p-12 relative overflow-x-hidden">
      {/* Fondos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <Link href="/admin/nacional/dashboard" className="group flex items-center gap-2 text-white/30 hover:text-white transition-colors mb-6">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:border-white/20">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-black uppercase tracking-[0.2em] text-[10px]">Portal Nacional</span>
            </Link>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
              Visualizar <br />
              <span className="text-black bg-rose-400 px-4 py-2 inline-block -skew-x-6 mt-2">Elecciones</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">Activas / Escrutadas</p>
                <p className="text-4xl font-black text-white leading-none mt-1">{unidades.length}</p>
             </div>
             <div className="p-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-[0_0_30px_rgba(225,29,72,0.1)]">
                <Database className="w-10 h-10 text-rose-400" />
             </div>
          </div>
        </div>

        {/* Buscador */}
        <div className="mb-10 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-rose-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por elección o provincia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-[35px] pl-16 pr-8 py-5 md:py-6 focus:outline-none focus:border-rose-500/50 transition-all font-bold placeholder:text-white/10 uppercase text-xs md:text-sm tracking-tight"
          />
        </div>

        {/* Listado Agrupado */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 text-rose-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 bg-white/5 border border-dashed border-white/10 rounded-[60px] flex flex-col items-center justify-center gap-6">
            <div className="p-8 bg-white/5 rounded-[40px]">
              <FolderOpen className="w-16 h-16 text-white/10" />
            </div>
            <div className="text-center px-4">
              <h4 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white/40">Sin resultados</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-2">No hay elecciones en fase de escrutinio que coincidan.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Procesos Agrupados */}
            {procesos.map(proc => {
              const unidadesDeEsteProceso = unidadesPorProceso(proc.id);
              if (unidadesDeEsteProceso.length === 0) return null;
              const isExpanded = expandedProceso === proc.id;

              return (
                <div key={proc.id} className="bg-[#111827]/40 border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-xl">
                  <div 
                    className="flex items-center justify-between p-6 md:p-8 cursor-pointer group hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedProceso(isExpanded ? null : proc.id)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 shrink-0">
                        <CalendarRange className="w-6 h-6 text-rose-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg md:text-xl font-black tracking-tight uppercase truncate">{proc.nombre}</h3>
                        <p className="text-[9px] font-black text-rose-400/60 uppercase tracking-widest mt-1">
                          {unidadesDeEsteProceso.length} Eleccion{unidadesDeEsteProceso.length !== 1 ? 'es' : ''} en este proceso
                        </p>
                      </div>
                    </div>
                    <div className={`p-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-5 h-5 text-white/20" />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 md:px-8 pb-8 space-y-4 border-t border-white/5 pt-6">
                      {unidadesDeEsteProceso.map(u => renderUnidadCard(u))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unidades sin proceso */}
            {unidadesSinProceso.length > 0 && (
              <div className="space-y-4">
                <div className="px-6 flex items-center gap-3">
                   <div className="h-[1px] flex-1 bg-white/5" />
                   <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Otras Elecciones</span>
                   <div className="h-[1px] flex-1 bg-white/5" />
                </div>
                <div className="space-y-4">
                  {unidadesSinProceso.map(u => renderUnidadCard(u))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
