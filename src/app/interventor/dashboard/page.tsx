"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, ClipboardList, Loader2, ArrowRight, Lock, Trash2 } from 'lucide-react';

export default function InterventorDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [mesas, setMesas] = useState<any[]>([]);
  const [loadingMesas, setLoadingMesas] = useState(true);
  const [ocultandoId, setOcultandoId] = useState<string | null>(null);
  const [showConfirmOcultar, setShowConfirmOcultar] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.user_metadata?.role !== 'interventor') {
        router.replace('/interventor');
      } else {
        const metadata = session.user.user_metadata;
        const displayName = metadata?.full_name || metadata?.nombre || session.user.email;
        setUserName(displayName ?? null);
        setUserId(session.user.id);
        loadMesas(session.user.id);
      }
    };
    checkSession();
  }, [router, supabase]);

  const loadMesas = async (uid: string) => {
    try {
      const res = await fetch('/api/interventor/mis-mesas', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ userId: uid })
      });
      const data = await res.json();
      if (res.ok) setMesas(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMesas(false);
    }
  };

  const handleOcultarMesa = async (mesaId: string) => {
    if (!userId) return;
    setOcultandoId(mesaId);
    try {
      const res = await fetch('/api/interventor/ocultar-mesa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesaId, userId })
      });
      if (res.ok) {
        setMesas(prev => prev.filter(m => m.id !== mesaId));
      } else {
        const data = await res.json();
        alert(data.error || 'Error al ocultar la mesa');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    } finally {
      setOcultandoId(null);
      setShowConfirmOcultar(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  // Ordenar: editables primero, bloqueadas al final
  const mesasOrdenadas = [...mesas].sort((a, b) => {
    const aCongelada = a.unidades_electorales?.estado === 'congelada' ? 1 : 0;
    const bCongelada = b.unidades_electorales?.estado === 'congelada' ? 1 : 0;
    return aCongelada - bCongelada;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Navbar Superior */}
      <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shadow-sm shrink-0">
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700 shrink-0">
            <ClipboardList className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <h1 className="text-lg md:text-2xl font-black text-gray-800 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
            Panel <span className="text-emerald-700 hidden sm:inline">de Interventor</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-6 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Activo como</span>
            <span className="text-sm font-semibold text-gray-700">{userName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors text-sm md:text-base"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden xs:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 p-4 md:p-8">
         <h2 className="text-xl font-bold mb-6 text-gray-800">Procesos Electorales Asignados</h2>
         {loadingMesas ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>
         ) : mesasOrdenadas.length === 0 ? (
            <div className="bg-white p-6 md:p-12 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-4 max-w-xl mx-auto mt-10">
              <ClipboardList className="w-16 h-16 text-gray-300" />
              <h3 className="text-xl font-bold text-gray-500">No hay procesos activos</h3>
              <p className="text-gray-400 text-sm max-w-sm">No tienes ninguna mesa electoral asignada en este momento. Cuando la administración central te asigne una unidad, aparecerá aquí automáticamente.</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
               {mesasOrdenadas.map(m => {
                 const isCongelada = m.unidades_electorales?.estado === 'congelada';
                 
                 return (
                  <div key={m.id} className={`bg-white p-5 md:p-6 rounded-3xl shadow-sm border flex flex-col space-y-4 transition-all group relative ${isCongelada ? 'border-blue-200 opacity-75' : 'border-gray-100 hover:shadow-xl hover:border-emerald-200'}`}>
                    <div className="flex justify-between items-start">
                      <div className={`p-3 rounded-2xl ${isCongelada ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600 group-hover:scale-110'} transition-transform`}>
                         {isCongelada ? <Lock className="w-6 h-6" /> : <ClipboardList className="w-6 h-6" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest ${
                          isCongelada 
                            ? 'bg-blue-100 text-blue-700' 
                            : m.estado === 'enviada' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-700'
                        }`}>
                           {isCongelada ? 'BLOQUEADA' : m.estado === 'enviada' ? 'ENVIADA' : 'PENDIENTE'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-gray-800 leading-tight" title={m.unidades_electorales?.nombre}>
                        {m.unidades_electorales?.nombre}
                      </h3>
                      <p className={`font-bold uppercase text-[10px] md:text-xs tracking-widest ${isCongelada ? 'text-blue-600' : 'text-emerald-700'}`}>
                        {m.nombre_identificador}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {m.unidades_electorales?.provincias?.nombre && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                            Provincia: {m.unidades_electorales?.provincias?.nombre}
                          </span>
                        )}
                        {m.unidades_electorales?.sectores?.nombre && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                            {m.unidades_electorales?.sectores?.nombre}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100 mt-auto">
                      {isCongelada ? (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 py-4 bg-blue-50 text-blue-600 font-black rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-blue-200">
                             <Lock className="w-3.5 h-3.5" /> Resultados Bloqueados
                          </div>
                          <button 
                            onClick={() => setShowConfirmOcultar(m.id)}
                            disabled={ocultandoId === m.id}
                            className="p-3.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-400 hover:text-red-600 rounded-2xl transition-all active:scale-95 disabled:opacity-50 shrink-0"
                            title="Eliminar del panel"
                          >
                            {ocultandoId === m.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => router.push(`/interventor/mesa/${m.id}`)} className="w-full py-4 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-black rounded-2xl transition-colors uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                           Acceder al Formulario <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                 );
               })}
            </div>
         )}
      </main>

      {/* Modal de confirmación para ocultar mesa */}
      {showConfirmOcultar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 space-y-6 shadow-2xl text-center">
            <div className="p-4 bg-red-50 rounded-2xl inline-block mx-auto">
              <Trash2 className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">
              ¿Eliminar del panel?
            </h2>
            <p className="text-gray-500 text-sm font-medium">
              Esta mesa bloqueada desaparecerá de tu lista. Los resultados electorales <span className="font-black text-gray-700">NO se borrarán</span> y seguirán visibles para la administración.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmOcultar(null)}
                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl uppercase text-xs tracking-widest transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleOcultarMesa(showConfirmOcultar)}
                disabled={!!ocultandoId}
                className="flex-[2] py-4 bg-red-500 hover:bg-red-400 text-white font-black rounded-2xl uppercase text-xs tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {ocultandoId ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
