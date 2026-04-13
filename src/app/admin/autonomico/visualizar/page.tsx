"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
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
  FolderOpen,
  Trash2,
  AlertTriangle,
  X,
  Bell,
  Clock
} from 'lucide-react';

const supabase = createClient();

export default function VisualizarEleccionesAutonomicoPage() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [procesos, setProcesos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProceso, setExpandedProceso] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [comunidad, setComunidad] = useState<string>('');
  
  // Notificaciones RT logic
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [lastNotifId, setLastNotifId] = useState<string | null>(null);
  const [isNewNotif, setIsNewNotif] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);

  useEffect(() => {
    // Solicitar permisos para notificaciones del navegador
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const com = session?.user?.user_metadata?.comunidad || '';
      setComunidad(com);
      if (com) loadData(com);
    };
    init();
    const interval = setInterval(loadNotifications, 10000);
    loadNotifications();
    return () => clearInterval(interval);
  }, []);

  const dismissNotification = async (id: string) => {
    try {
      setNotificaciones(prev => prev.filter(n => n.id !== id));
      await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (err) {
      console.error("Error eliminando notificación:", err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      if (Array.isArray(data)) {
        if (data.length > 0) {
          if (lastNotifId && data[0].id !== lastNotifId) {
            setIsNewNotif(true);
            setTimeout(() => setIsNewNotif(false), 5000);

            // Disparar notificación nativa del navegador
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Nuevo Envío Detectado', {
                body: `Se han recibido datos de ${data[0].nombre_identificador} (${data[0].unidad?.nombre || 'Unidad desconocida'})`,
              });
            }
          }
          setLastNotifId(data[0].id);
        }
        setNotificaciones(data);
      }
    } catch (err) {
      console.error("Error cargando notificaciones:", err);
    }
  };

  const loadData = async (com: string) => {
    setLoading(true);
    try {
      const [unidadesResp, procesosResp] = await Promise.all([
        fetch(`/api/admin/autonomico/unidades?comunidad=${encodeURIComponent(com)}`).then(r => r.json()).catch(() => []),
        fetch('/api/admin/procesos-electorales').then(r => r.json()).catch(() => [])
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
    <div key={u.id} className="relative group">
      <Link 
        href={`/admin/autonomico/visualizar/${u.id}`} 
        className="flex flex-col md:flex-row justify-between md:items-center bg-[#111827]/40 border border-white/5 hover:border-rose-500/30 rounded-[30px] p-5 md:p-6 transition-all hover:bg-[#111827]/80 hover:shadow-[0_10px_40px_rgba(225,29,72,0.1)] gap-4 md:gap-6"
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
          
          {/* Botón de Eliminación - Nueva Posición */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setUnitToDelete(u);
              setDeleteModalOpen(true);
            }}
            className="p-3 rounded-2xl bg-white/5 border border-white/5 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 shadow-xl backdrop-blur-md"
            title="Eliminar esta elección"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <div className="text-left md:text-center">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Delegados</p>
            <p className="text-2xl font-black text-rose-400">{u.delegados_a_elegir}</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-rose-500 transition-colors">
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white/30 group-hover:text-white transition-colors" />
          </div>
        </div>
      </Link>
    </div>
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
            <Link href="/admin/autonomico/dashboard" className="group flex items-center gap-2 text-white/30 hover:text-white transition-colors mb-6">
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
             {!showNotifications && (
               <button 
                 onClick={() => setShowNotifications(true)}
                 className="p-4 bg-white/5 hover:bg-emerald-500/20 border border-white/10 rounded-3xl backdrop-blur-3xl shadow-lg transition-all active:scale-95 group relative"
                 title="Restaurar Notificaciones"
               >
                  <Bell className={`w-6 h-6 ${isNewNotif ? 'text-emerald-400 animate-bounce' : 'text-white/30 group-hover:text-white'}`} />
                  {isNewNotif && <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />}
               </button>
             )}
             <div className="p-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-[0_0_30px_rgba(225,29,72,0.1)]">
                <Database className="w-10 h-10 text-rose-400" />
             </div>
          </div>
        </div>

        {/* MÓDULO DE NOTIFICACIONES RT */}
        {showNotifications && (
          <div className={`mb-12 transition-all duration-700 ${isNewNotif ? 'scale-[1.02]' : 'scale-100'}`}>
             <div className={`bg-[#111827]/60 backdrop-blur-3xl border ${isNewNotif ? 'border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.2)]' : 'border-white/5'} rounded-[40px] p-8 md:p-10 relative overflow-hidden group`}>
                {isNewNotif && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse" />
                )}
                
                {/* Botón Minimizar */}
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all active:scale-95 z-10"
                  title="Minimizar Notificaciones"
                >
                   <X className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl border transition-colors ${isNewNotif ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                       <Bell className={`w-6 h-6 ${isNewNotif ? 'text-emerald-400 animate-bounce' : 'text-white/30'}`} />
                    </div>
                    <div>
                      <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 leading-none mb-1">Actividad Reciente</h2>
                      <p className="text-xl font-black uppercase tracking-tight">Entrada de Datos Interventores</p>
                    </div>
                 </div>
                 {isNewNotif && (
                   <span className="px-4 py-1.5 bg-emerald-500 text-black font-black text-[9px] uppercase tracking-widest rounded-full animate-bounce">
                     Nuevo Envío Detectado
                   </span>
                 )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {notificaciones.length > 0 ? notificaciones.map((n: any, idx: number) => {
                    const timeStr = n.fecha_envio ? new Date(n.fecha_envio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                    return (
                      <div key={n.id} className={`p-5 rounded-3xl border transition-all relative group/notif ${idx === 0 && isNewNotif ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                         {/* Botón Borrado Individual */}
                         <button 
                           onClick={() => dismissNotification(n.id)}
                           className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 opacity-0 group-hover/notif:opacity-100 hover:bg-rose-500 hover:text-white transition-all text-white/20"
                           title="Eliminar notificación"
                         >
                           <X className="w-3 h-3" />
                         </button>

                         <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-black text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1.5">
                               <Clock className="w-3 h-3" /> {timeStr}
                            </span>
                            <span className="text-[10px] font-bold text-white/20">#{n.id.slice(-4).toUpperCase()}</span>
                         </div>
                         <p className="text-[11px] font-black uppercase text-white tracking-tight truncate mb-1 pr-6">
                            {n.unidad?.nombre}
                         </p>
                         <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest truncate">
                            {n.nombre_identificador} - {n.interventor?.nombre_completo || 'SISTEMA'}
                         </p>
                      </div>
                    );
                 }) : (
                    <div className="md:col-span-3 py-10 text-center border border-dashed border-white/5 rounded-3xl">
                       <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Esperando actividad de interventores...</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

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

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {deleteModalOpen && unitToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-[#111827] border border-white/10 w-full max-w-lg rounded-[50px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.7)] relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
              
              <div className="p-12 text-center space-y-8">
                 <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                    <AlertTriangle className="w-12 h-12 text-rose-500" />
                 </div>
                 
                 <div className="space-y-4">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">¿Eliminar Elección?</h2>
                    <p className="text-white/40 text-sm font-medium leading-relaxed">
                       Estás a punto de borrar definitivamente la unidad <br />
                       <span className="text-white font-black uppercase text-base tracking-tight">{unitToDelete.nombre}</span>.
                    </p>
                    <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-2xl text-[10px] font-black text-rose-400 uppercase tracking-widest">
                       ⚠️ Esta acción borrará mesas, interventores y votos asociados de forma irreversible.
                    </div>
                 </div>

                 <div className="flex flex-col gap-4">
                    <button 
                      onClick={async () => {
                        setDeleting(true);
                        try {
                          const res = await fetch(`/api/admin/unidades/${unitToDelete.id}`, { method: 'DELETE' });
                          if (res.ok) {
                            setUnidades(unidades.filter(u => u.id !== unitToDelete.id));
                            setDeleteModalOpen(false);
                            setUnitToDelete(null);
                          } else {
                            const data = await res.json();
                            alert(`Error al eliminar: ${data.error || 'Inténtalo de nuevo'}`);
                          }
                        } catch (err: any) {
                          console.error(err);
                          alert(`Error de red: ${err.message}`);
                        } finally {
                          setDeleting(false);
                        }
                      }}
                      disabled={deleting}
                      className="w-full py-6 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-sm transition-all shadow-xl active:scale-95 disabled:opacity-50"
                    >
                       {deleting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "ELIMINAR DEFINITIVAMENTE"}
                    </button>
                    <button 
                      onClick={() => { setDeleteModalOpen(false); setUnitToDelete(null); }}
                      className="w-full py-5 text-white/30 hover:text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all"
                    >
                       CANCELAR Y VOLVER
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
