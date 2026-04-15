"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  Loader2,
  ChevronRight,
  ChevronDown,
  Database,
  CalendarRange,
  Building2,
  Layers,
  MapPin,
  FolderOpen,
  SlidersHorizontal,
  Calendar,
  X
} from 'lucide-react';

export default function EleccionesPublicasPage() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [procesos, setProcesos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProceso, setExpandedProceso] = useState<string | null>(null);

  // Filtros multi-select
  const [filterProvincias, setFilterProvincias] = useState<string[]>([]);
  const [filterSectores, setFilterSectores] = useState<string[]>([]);
  const [filterUnidades, setFilterUnidades] = useState<string[]>([]);
  const [filterOrganos, setFilterOrganos] = useState<string[]>([]);
  const [filterAnyos, setFilterAnyos] = useState<string[]>([]);
  const [openPanel, setOpenPanel] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [unidadesResp, procesosResp] = await Promise.all([
        fetch('/api/public/unidades').then(r => r.json()).catch(() => []),
        fetch('/api/public/procesos-electorales').then(r => r.json()).catch(() => [])
      ]);

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

  // Opciones únicas para cada filtro (derivadas de los datos cargados)
  const optProvincias = [...new Set(unidades.map(u => u.provincias?.nombre).filter(Boolean))].sort();
  const optSectores   = [...new Set(unidades.map(u => u.sectores?.nombre).filter(Boolean))].sort();
  const optUnidades   = [...new Set(unidades.map(u => u.nombre).filter(Boolean))].sort();
  const optOrganos    = [...new Set(unidades.map(u => u.tipos_organos?.nombre).filter(Boolean))].sort();
  const optAnyos      = [...new Set(unidades.map(u => String(u.anio)).filter(v => v && v !== 'undefined' && v !== 'null'))].sort().reverse();

  const toggleFilter = (set: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    set(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const hasFilters = filterProvincias.length > 0 || filterSectores.length > 0 || filterUnidades.length > 0 || filterOrganos.length > 0 || filterAnyos.length > 0 || searchTerm !== '';

  const clearAllFilters = () => {
    setFilterProvincias([]);
    setFilterSectores([]);
    setFilterUnidades([]);
    setFilterOrganos([]);
    setFilterAnyos([]);
    setSearchTerm('');
  };

  const filtered = unidades.filter(u => {
    // Filtro por término de búsqueda (nombre o provincia)
    if (searchTerm) {
      const term = searchTerm.toUpperCase();
      const matchesSearch = u.nombre.toUpperCase().includes(term) || 
                           (u.provincias?.nombre || '').toUpperCase().includes(term);
      if (!matchesSearch) return false;
    }

    // Filtros multi-select
    if (filterProvincias.length > 0 && !filterProvincias.includes(u.provincias?.nombre)) return false;
    if (filterSectores.length > 0   && !filterSectores.includes(u.sectores?.nombre))    return false;
    if (filterUnidades.length > 0   && !filterUnidades.includes(u.nombre))              return false;
    if (filterOrganos.length > 0    && !filterOrganos.includes(u.tipos_organos?.nombre)) return false;
    if (filterAnyos.length > 0      && !filterAnyos.includes(String(u.anio)))           return false;
    
    return true;
  });

  const unidadesPorProceso = (procesoId: string) => filtered.filter(u => u.proceso_electoral_id === procesoId);
  const unidadesSinProceso = filtered.filter(u => {
    if (!u.proceso_electoral_id || u.proceso_electoral_id === 'NO_PROCEDE') return true;
    return !procesos.some(p => p.id === u.proceso_electoral_id);
  });

  const renderUnidadCard = (u: any) => (
    <Link 
      href={`/elecciones/${u.id}`} 
      key={u.id}
      className="group flex flex-col md:flex-row justify-between md:items-center bg-[#111827]/40 border border-white/5 hover:border-emerald-500/30 rounded-[30px] p-5 md:p-6 transition-all hover:bg-[#111827]/80 hover:shadow-[0_10px_40px_rgba(0,140,69,0.1)] gap-4 md:gap-6"
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
             <Calendar className="w-3 h-3 text-emerald-400/50" /> {u.anio || 'N/A'}
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-[9px] font-bold uppercase tracking-widest">
             <MapPin className="w-3 h-3 text-emerald-400/50" /> {u.provincias?.nombre || 'General'}
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-[9px] font-bold uppercase tracking-widest">
             <Building2 className="w-3 h-3 text-emerald-400/50" /> {u.sectores?.nombre || 'General'}
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-[9px] font-bold uppercase tracking-widest">
             <Layers className="w-3 h-3 text-emerald-400/50" /> {u.tipos_organos?.nombre || 'General'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between md:justify-end gap-6 md:pl-6 md:border-l border-white/5 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
        <div className="text-left md:text-center">
          <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Delegados</p>
          <p className="text-2xl font-black text-emerald-400">{u.delegados_a_elegir}</p>
        </div>
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white/30 group-hover:text-white transition-colors" />
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#0a101f] text-white p-4 md:p-12 relative overflow-x-hidden">
      {/* Fondos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-green-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <Link href="/" className="group flex items-center gap-2 text-white/30 hover:text-white transition-colors mb-6">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:border-white/20">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-black uppercase tracking-[0.2em] text-[10px]">Inicio</span>
            </Link>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
              Resultados <br />
              <span className="text-black bg-emerald-400 px-4 py-2 inline-block -skew-x-6 mt-2">Electorales</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">Procesos Activos</p>
                <p className="text-4xl font-black text-white leading-none mt-1">{unidades.length}</p>
             </div>
             <div className="p-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-[0_0_30px_rgba(0,140,69,0.1)]">
                <Database className="w-10 h-10 text-emerald-400" />
             </div>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="mb-10 space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por elección o provincia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[35px] pl-16 pr-8 py-5 md:py-6 focus:outline-none focus:border-emerald-500/50 transition-all font-bold placeholder:text-white/10 uppercase text-xs md:text-sm tracking-tight"
            />
          </div>

          <div className="space-y-3">
            {/* Barra superior con botón limpiar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-white/40">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Filtros Avanzados</span>
                {(filterProvincias.length + filterSectores.length + filterUnidades.length + filterOrganos.length + filterAnyos.length) > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black border border-emerald-500/30">
                    {filterProvincias.length + filterSectores.length + filterUnidades.length + filterOrganos.length + filterAnyos.length} activos
                  </span>
                )}
              </div>
              {hasFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-emerald-400 transition-colors"
                >
                  <X className="w-3 h-3" /> Limpiar todo
                </button>
              )}
            </div>

            {/* Dropdowns de Filtros */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'provincia', label: 'Provincia', icon: <MapPin className="w-3 h-3" />, opts: optProvincias, selected: filterProvincias, setter: setFilterProvincias },
                { key: 'sector',    label: 'Sector',    icon: <Building2 className="w-3 h-3" />, opts: optSectores,   selected: filterSectores,   setter: setFilterSectores },
                { key: 'unidad',    label: 'Unidad Electoral', icon: <Database className="w-3 h-3" />, opts: optUnidades,   selected: filterUnidades,   setter: setFilterUnidades },
                { key: 'organo',    label: 'Tipo de Órgano',   icon: <Layers className="w-3 h-3" />,   opts: optOrganos,    selected: filterOrganos,    setter: setFilterOrganos },
                { key: 'anyo',      label: 'Año',       icon: <Calendar className="w-3 h-3" />, opts: optAnyos,      selected: filterAnyos,      setter: setFilterAnyos },
              ].map(({ key, label, icon, opts, selected, setter }) => (
                <div key={key} className="relative">
                  <button
                    onClick={() => setOpenPanel(openPanel === key ? null : key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      selected.length > 0
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {icon}
                    {label}
                    {selected.length > 0 && (
                      <span className="bg-emerald-500/30 text-emerald-300 rounded-full w-4 h-4 flex items-center justify-center text-[8px]">
                        {selected.length}
                      </span>
                    )}
                    <ChevronDown className={`w-3 h-3 transition-transform ${openPanel === key ? 'rotate-180' : ''}`} />
                  </button>

                  {openPanel === key && opts.length > 0 && (
                    <div className="absolute top-full mt-2 left-0 z-50 bg-[#111827] border border-white/10 rounded-2xl shadow-2xl min-w-[220px] max-h-64 overflow-y-auto">
                      <div className="p-2 space-y-0.5">
                        {opts.map((opt: string) => (
                          <button
                            key={opt}
                            onClick={() => toggleFilter(setter, opt)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-[11px] font-bold uppercase tracking-wide ${
                              selected.includes(opt)
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                                : 'text-white/50 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                              selected.includes(opt) ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                            }`}>
                              {selected.includes(opt) && <X className="w-2.5 h-2.5 text-white" />}
                            </span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Tags activos */}
            {(filterProvincias.length + filterSectores.length + filterUnidades.length + filterOrganos.length + filterAnyos.length) > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {[...filterProvincias.map(v => ({ v, label: 'Provincia', setter: setFilterProvincias })),
                  ...filterSectores.map(v => ({ v, label: 'Sector', setter: setFilterSectores })),
                  ...filterUnidades.map(v => ({ v, label: 'Unidad', setter: setFilterUnidades })),
                  ...filterOrganos.map(v => ({ v, label: 'Órgano', setter: setFilterOrganos })),
                  ...filterAnyos.map(v => ({ v, label: 'Año', setter: setFilterAnyos })),
                ].map(({ v, label, setter }) => (
                  <span
                    key={`${label}-${v}`}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase tracking-widest"
                  >
                    <span className="text-emerald-500/50">{label}:</span> {v}
                    <button
                      onClick={() => toggleFilter(setter, v)}
                      className="w-4 h-4 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 flex items-center justify-center transition-all"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cerrar paneles al hacer click fuera */}
        {openPanel && (
          <div className="fixed inset-0 z-40" onClick={() => setOpenPanel(null)} />
        )}

        {/* Listado Agrupado */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 bg-white/5 border border-dashed border-white/10 rounded-[60px] flex flex-col items-center justify-center gap-6">
            <div className="p-8 bg-white/5 rounded-[40px]">
              <FolderOpen className="w-16 h-16 text-white/10" />
            </div>
            <div className="text-center px-4">
              <h4 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white/40">Sin resultados</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-2">No hay elecciones en curso que coincidan.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
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
                      <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shrink-0">
                        <CalendarRange className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg md:text-xl font-black tracking-tight uppercase truncate">{proc.nombre}</h3>
                        <p className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest mt-1">
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
