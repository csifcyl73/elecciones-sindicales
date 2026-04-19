"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Database, 
  Search, 
  Trash2, 
  Edit3, 
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Building2,
  BarChart2,
  Layers,
  FolderOpen,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  X,
  Save,
  Plus
} from 'lucide-react';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';

export default function GestionUnidadesPage() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [procesos, setProcesos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<string>('all');
  const [expandedProceso, setExpandedProceso] = useState<string | null>(null);
  const [expandedSinProceso, setExpandedSinProceso] = useState(true);
  const supabase = createClient();

  // Estado para edición de proceso
  const [editingProceso, setEditingProceso] = useState<any | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editPeriodo, setEditPeriodo] = useState('');
  const [editObservaciones, setEditObservaciones] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Estado para edición de unidad (asociar proceso + año)
  const [editingUnidad, setEditingUnidad] = useState<any | null>(null);
  const [editUnidadProcesoId, setEditUnidadProcesoId] = useState('');
  const [editUnidadAnio, setEditUnidadAnio] = useState('');
  const [savingUnidad, setSavingUnidad] = useState(false);

  // Estado para el modal de confirmación de borrado
  const [deleteConfig, setDeleteConfig] = useState<{ id: string, nombre: string, type: 'unidad' | 'proceso' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [unidadesResp, procesosResp] = await Promise.all([
        fetch('/api/admin/unidades').then(r => r.json()).catch(() => []),
        fetch('/api/admin/procesos-electorales').then(r => r.json()).catch(() => [])
      ]);

      if (Array.isArray(unidadesResp)) setUnidades(unidadesResp);
      if (Array.isArray(procesosResp)) setProcesos(procesosResp);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteConfig) return;
    setIsDeleting(true);
    
    try {
      if (deleteConfig.type === 'unidad') {
        const resp = await fetch('/api/admin/unidades', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: deleteConfig.id })
        });
        if (!resp.ok) { const d = await resp.json(); throw new Error(d.error); }
        setUnidades(unidades.filter(u => u.id !== deleteConfig.id));
      } else {
        const resp = await fetch('/api/admin/procesos-electorales', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: deleteConfig.id })
        });
        if (!resp.ok) { const d = await resp.json(); throw new Error(d.error); }
        setProcesos(procesos.filter(p => p.id !== deleteConfig.id));
        setUnidades(unidades.map(u => u.proceso_electoral_id === deleteConfig.id ? {...u, proceso_electoral_id: null} : u));
      }
      setDeleteConfig(null);
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditProceso = (p: any) => {
    setEditingProceso(p);
    setEditNombre(p.nombre || '');
    setEditPeriodo(p.periodo || '');
    setEditObservaciones(p.observaciones || '');
  };

  const openEditUnidad = (u: any) => {
    setEditingUnidad(u);
    setEditUnidadProcesoId(u.proceso_electoral_id || '');
    setEditUnidadAnio(u.anio?.toString() || '');
  };

  const saveEditUnidad = async () => {
    if (!editingUnidad) return;
    setSavingUnidad(true);
    try {
      const procId = editUnidadProcesoId && editUnidadProcesoId !== 'NO_PROCEDE' ? editUnidadProcesoId : null;
      const anioVal = editUnidadAnio ? parseInt(editUnidadAnio) : null;

      const { error } = await supabase
        .from('unidades_electorales')
        .update({ proceso_electoral_id: procId, anio: anioVal })
        .eq('id', editingUnidad.id);

      if (error) throw error;
      setUnidades(unidades.map(u => u.id === editingUnidad.id ? { ...u, proceso_electoral_id: procId, anio: anioVal } : u));
      setEditingUnidad(null);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSavingUnidad(false);
    }
  };

  const saveEditProceso = async () => {
    if (!editingProceso) return;
    setSavingEdit(true);
    try {
      const resp = await fetch('/api/admin/procesos-electorales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingProceso.id, nombre: editNombre, periodo: editPeriodo, observaciones: editObservaciones })
      });
      if (!resp.ok) { const d = await resp.json(); throw new Error(d.error); }
      const updated = await resp.json();
      setProcesos(procesos.map(p => p.id === editingProceso.id ? { ...p, ...updated } : p));
      setEditingProceso(null);
    } catch (err: any) {
      alert('Error guardando: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'configuracion':
        return { icon: <Clock className="w-3 h-3" />, text: 'Borrador', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      case 'activa':
        return { icon: <CheckCircle2 className="w-3 h-3" />, text: 'Activa', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
      case 'escrutinio':
        return { icon: <BarChart2 className="w-3 h-3" />, text: 'Escrutinio', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      default:
        return { icon: null, text: estado, class: 'bg-white/5 text-white/40' };
    }
  };

  const filtered = unidades.filter(u => {
    // Si la unidad está congelada, ya pasó al histórico, la quitamos de este panel interactivo
    if (u.estado === 'congelada') return false;
    
    const term = searchTerm.toUpperCase();
    const matchesSearch = u.nombre.toUpperCase().includes(term) || 
                         (u.provincias?.nombre || '').toUpperCase().includes(term) ||
                         (u.anio?.toString() || '').includes(term);
    const matchesFilter = filterState === 'all' || u.estado === filterState;
    return matchesSearch && matchesFilter;
  });

  // Agrupar unidades por proceso
  const unidadesPorProceso = (procesoId: string) => filtered.filter(u => u.proceso_electoral_id === procesoId);
  const unidadesSinProceso = filtered.filter(u => {
    if (!u.proceso_electoral_id || u.proceso_electoral_id === 'NO_PROCEDE') return true;
    // Si el ID de proceso tiene valor pero NO existe en nuestro listado, se muestra aquí para no quedar oculto
    return !procesos.some(p => p.id === u.proceso_electoral_id);
  });

  const renderUnidadCard = (u: any) => {
    const badge = getStatusBadge(u.estado);
    const procesoAsociado = procesos.find(p => p.id === u.proceso_electoral_id);
    return (
      <div key={u.id} className="group bg-[#0d1424] border border-white/5 p-6 rounded-3xl hover:border-emerald-500/20 transition-all duration-300 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div className={`px-3 py-1 rounded-full border flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${badge.class}`}>
            {badge.icon} {badge.text}
          </div>
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={() => openEditUnidad(u)} className="p-2 bg-amber-500/10 rounded-xl hover:bg-amber-500 hover:text-black text-amber-400 transition-all" title="Asociar proceso">
              <FolderOpen className="w-4 h-4" />
            </button>
            <Link href={`/admin/nacional/configurar-elecciones?unidad_id=${u.id}`} className="p-2 bg-white/5 rounded-xl hover:bg-emerald-500 hover:text-black transition-all">
              <Edit3 className="w-4 h-4" />
            </Link>
            <button onClick={() => setDeleteConfig({ id: u.id, nombre: u.nombre, type: 'unidad' })} className="p-2 bg-white/5 rounded-xl hover:bg-rose-500 text-white/30 hover:text-white transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <h4 className="text-lg font-black tracking-tight uppercase line-clamp-2 mb-3 leading-tight">{u.nombre}</h4>
        
        {/* Etiqueta de proceso asociado */}
        {procesoAsociado && (
          <div className="mb-3 px-3 py-1.5 bg-amber-500/5 border border-amber-500/10 rounded-xl inline-flex items-center gap-1.5">
            <FolderOpen className="w-3 h-3 text-amber-400/50" />
            <span className="text-[9px] font-black text-amber-400/60 uppercase tracking-wider truncate">{procesoAsociado.nombre}</span>
          </div>
        )}
        {u.anio && (
          <span className="ml-2 text-[10px] font-black text-white/20 uppercase">Año {u.anio}</span>
        )}

        <div className="grid grid-cols-2 gap-3 text-[10px] mt-3">
          <div className="flex items-center gap-2 text-white/40">
            <MapPin className="w-3 h-3 text-emerald-400/50" /> <span className="truncate font-bold">{u.provincias?.nombre || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <Layers className="w-3 h-3 text-emerald-400/50" /> <span className="truncate font-bold">{u.tipos_organos?.nombre || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <Building2 className="w-3 h-3 text-emerald-400/50" /> <span className="truncate font-bold">{u.sectores?.nombre || '—'}</span>
          </div>
          <div className="text-right">
            <span className="text-emerald-400 font-black text-lg">{u.delegados_a_elegir}</span>
            <span className="text-white/20 font-bold ml-1">del.</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a101f] text-white p-6 md:p-12 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <Link href="/admin/nacional/dashboard" className="group flex items-center gap-2 text-white/30 hover:text-white transition-colors mb-6">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:border-white/20">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-black uppercase tracking-[0.2em] text-[10px]">Panel Nacional</span>
            </Link>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
              Gestor de <br />
              <span className="text-black bg-emerald-400 px-4 py-1 inline-block -skew-x-6 mt-2">Procesos Electorales</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">Procesos</p>
                <p className="text-4xl font-black text-amber-400 leading-none mt-1">{procesos.length}</p>
             </div>
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">Elecciones</p>
                <p className="text-4xl font-black text-white leading-none mt-1">{unidades.length}</p>
             </div>
             <div className="p-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-3xl">
                <Database className="w-10 h-10 text-emerald-400" />
             </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-10">
          <div className="md:col-span-8 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar unidad electoral por nombre o provincia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[35px] pl-16 pr-8 py-6 focus:outline-none focus:border-emerald-500/50 transition-all font-bold placeholder:text-white/10 uppercase text-sm tracking-tight"
            />
          </div>
          <div className="md:col-span-4 flex gap-2">
            <select 
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[35px] px-8 py-6 focus:outline-none focus:border-emerald-500/50 appearance-none font-black uppercase text-[10px] tracking-widest cursor-pointer text-white/60"
            >
              <option value="all">Todos los Estados</option>
              <option value="activa">Solo Activas</option>
              <option value="configuracion">En Borrador</option>
              <option value="escrutinio">En Escrutinio</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* === PROCESOS ELECTORALES === */}
            {procesos.map(proc => {
              const unidadesDeEsteProceso = unidadesPorProceso(proc.id);
              const isExpanded = expandedProceso === proc.id;

              return (
                <div key={proc.id} className="bg-[#111827]/60 border border-white/10 rounded-[40px] overflow-hidden backdrop-blur-xl transition-all hover:border-amber-500/20">
                  {/* Cabecera del proceso */}
                  <div 
                    className="flex items-center justify-between p-8 cursor-pointer group"
                    onClick={() => setExpandedProceso(isExpanded ? null : proc.id)}
                  >
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                      <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 shrink-0">
                        <FolderOpen className="w-7 h-7 text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-black tracking-tight uppercase truncate">{proc.nombre}</h3>
                        <div className="flex items-center gap-4 mt-1.5">
                          {proc.periodo && (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400/60 uppercase tracking-widest">
                              <CalendarRange className="w-3 h-3" /> {proc.periodo}
                            </span>
                          )}
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                            {unidadesDeEsteProceso.length} eleccion{unidadesDeEsteProceso.length !== 1 ? 'es' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); openEditProceso(proc); }} className="p-2.5 bg-white/5 rounded-xl hover:bg-amber-500 hover:text-black text-white/30 transition-all opacity-0 group-hover:opacity-100">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfig({ id: proc.id, nombre: proc.nombre, type: 'proceso' }); }} className="p-2.5 bg-white/5 rounded-xl hover:bg-rose-500 text-white/30 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className={`p-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-5 h-5 text-white/30" />
                      </div>
                    </div>
                  </div>

                  {/* Contenido expandido */}
                  {isExpanded && (
                    <div className="px-8 pb-8 border-t border-white/5 pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      {proc.observaciones && (
                        <div className="mb-6 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                          <p className="text-[10px] font-black text-amber-400/40 uppercase tracking-widest mb-1">Observaciones</p>
                          <p className="text-sm text-white/60 font-medium">{proc.observaciones}</p>
                        </div>
                      )}
                      {unidadesDeEsteProceso.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {unidadesDeEsteProceso.map(u => renderUnidadCard(u))}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <Layers className="w-10 h-10 text-white/10 mx-auto mb-3" />
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No hay elecciones asociadas a este proceso</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* === UNIDADES SIN PROCESO === */}
            {unidadesSinProceso.length > 0 && (
              <div className="bg-[#111827]/40 border border-white/5 rounded-[40px] overflow-hidden">
                <div 
                  className="flex items-center justify-between p-8 cursor-pointer group"
                  onClick={() => setExpandedSinProceso(!expandedSinProceso)}
                >
                  <div className="flex items-center gap-5">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                      <AlertCircle className="w-7 h-7 text-white/30" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight uppercase text-white/50">NO PROCEDE</h3>
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                        {unidadesSinProceso.length} eleccion{unidadesSinProceso.length !== 1 ? 'es' : ''}
                      </span>
                    </div>
                  </div>
                  <div className={`p-2 transition-transform ${expandedSinProceso ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-white/30" />
                  </div>
                </div>

                {expandedSinProceso && (
                  <div className="px-8 pb-8 border-t border-white/5 pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {unidadesSinProceso.map(u => renderUnidadCard(u))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sin datos */}
            {procesos.length === 0 && unidadesSinProceso.length === 0 && (
              <div className="py-20 bg-white/5 border border-dashed border-white/10 rounded-[60px] flex flex-col items-center justify-center gap-6">
                <div className="p-8 bg-white/5 rounded-[40px]">
                  <FolderOpen className="w-16 h-16 text-white/10" />
                </div>
                <div className="text-center">
                  <h4 className="text-2xl font-black uppercase tracking-tighter text-white/40">Sin procesos electorales</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-2">Crea un proceso desde Configurar Elecciones</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL EDITAR PROCESO */}
      {editingProceso && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#111827] border border-white/10 w-full max-w-lg rounded-[50px] p-12 space-y-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-[150px] bg-amber-500/10 blur-[50px] -translate-y-1/2" />
             <div className="relative z-10 text-center">
                <Edit3 className="w-10 h-10 text-amber-400 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Editar Proceso Electoral</h2>
             </div>
             
             <div className="space-y-5 relative z-10">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-white/40 uppercase tracking-widest px-4">Nombre</label>
                   <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value.toUpperCase())} className="w-full bg-black/40 border-2 border-white/10 rounded-3xl px-8 py-5 text-white font-black uppercase text-sm focus:outline-none focus:border-amber-500 transition-all text-center" />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-white/40 uppercase tracking-widest px-4">Periodo Temporal</label>
                   <input type="text" value={editPeriodo} onChange={(e) => setEditPeriodo(e.target.value.toUpperCase())} className="w-full bg-black/40 border-2 border-white/10 rounded-3xl px-8 py-5 text-white font-black uppercase text-xs focus:outline-none focus:border-amber-500 transition-all text-center" />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-white/40 uppercase tracking-widest px-4">Observaciones</label>
                   <textarea value={editObservaciones} onChange={(e) => setEditObservaciones(e.target.value)} rows={3} className="w-full bg-black/40 border-2 border-white/10 rounded-3xl px-8 py-5 text-white/80 font-medium text-sm focus:outline-none focus:border-amber-500 transition-all resize-none" />
                </div>
             </div>

             <div className="flex gap-4 relative z-10">
                <button onClick={() => setEditingProceso(null)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase text-[10px] transition-all">Cancelar</button>
                <button disabled={savingEdit || !editNombre} onClick={saveEditProceso} className="flex-[2] py-5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl uppercase text-[12px] tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                   {savingEdit ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-5 h-5" /> Guardar Cambios</>}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR UNIDAD (ASOCIAR PROCESO + AÑO) */}
      {editingUnidad && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#111827] border border-white/10 w-full max-w-lg rounded-[50px] p-12 space-y-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-[150px] bg-emerald-500/10 blur-[50px] -translate-y-1/2" />
             <div className="relative z-10 text-center">
                <FolderOpen className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Editar Elección</h2>
                <p className="text-white/30 text-[10px] uppercase font-black tracking-widest mt-2 line-clamp-1">{editingUnidad.nombre}</p>
             </div>
             
             <div className="space-y-5 relative z-10">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-white/40 uppercase tracking-widest px-4">Asociar a Proceso Electoral</label>
                   <SearchableCombobox
                      options={[
                        { id: '', nombre: 'Sin proceso asociado' },
                        { id: 'NO_PROCEDE', nombre: 'NO PROCEDE' },
                        ...procesos.map(p => ({ id: p.id, nombre: `${p.nombre.toUpperCase()}${p.periodo ? ` · ${p.periodo}` : ''}` }))
                      ]}
                      value={editUnidadProcesoId}
                      onChange={(val) => setEditUnidadProcesoId(val)}
                      placeholder="SELECCIONA PROCESO ELECTORAL..."
                      className="w-full"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-white/40 uppercase tracking-widest px-4">Año</label>
                   <input 
                     type="text" 
                     inputMode="numeric" 
                     pattern="[0-9]*" 
                     maxLength={4} 
                     placeholder="2026" 
                     value={editUnidadAnio} 
                     onChange={(e) => setEditUnidadAnio(e.target.value.replace(/\D/g, ''))}
                     className="w-full bg-black/40 border-2 border-white/10 rounded-3xl px-8 py-5 text-emerald-400 font-black text-2xl text-center focus:outline-none focus:border-emerald-500 transition-all font-mono placeholder:text-white/15 placeholder:text-lg"
                   />
                </div>
             </div>

             <div className="flex gap-4 relative z-10">
                <button onClick={() => setEditingUnidad(null)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase text-[10px] transition-all">Cancelar</button>
                <button disabled={savingUnidad} onClick={saveEditUnidad} className="flex-[2] py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl uppercase text-[12px] tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                   {savingUnidad ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-5 h-5" /> Guardar Cambios</>}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR CONFIRMACIÓN */}
      {deleteConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#111827] border border-rose-500/30 w-full max-w-lg rounded-[50px] p-12 space-y-8 relative overflow-hidden text-center shadow-2xl">
             <div className="absolute top-0 left-0 w-full h-[150px] bg-rose-500/10 blur-[50px] -translate-y-1/2" />
             <div className="relative z-10">
                <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-4">
                  ¿ESTÁ SEGURO DE ELIMINAR EL PROCESO ELECTORAL SELECCIONADO?
                </h2>
                <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mb-8 bg-white/5 p-4 rounded-xl border border-white/10">{deleteConfig.nombre}</p>
             </div>
             
             <div className="flex gap-4 relative z-10 w-full">
                <button onClick={() => setDeleteConfig(null)} disabled={isDeleting} className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase text-[12px] transition-all text-white disabled:opacity-50">
                  Cancelar
                </button>
                <button 
                  onClick={executeDelete} 
                  disabled={isDeleting}
                  className="flex-[2] py-5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl uppercase text-[12px] tracking-widest transition-all shadow-[0_10px_40px_rgba(225,29,72,0.3)] hover:shadow-[0_10px_60px_rgba(225,29,72,0.5)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Confirmar'}
                </button>
             </div>
          </div>
        </div>
      )}

      <footer className="relative z-10 mt-20 pb-12 text-center text-white/10 text-[9px] font-black uppercase tracking-[0.3em]">
        CSIF · Sistema de Control Electoral Global · 2026 Frankfurt Hub
      </footer>
    </div>
  );
}
