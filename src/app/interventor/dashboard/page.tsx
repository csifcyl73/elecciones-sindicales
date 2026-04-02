"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, User, ClipboardList, LayoutDashboard, Loader2, ArrowRight } from 'lucide-react';

export default function InterventorDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [mesas, setMesas] = useState<any[]>([]);
  const [loadingMesas, setLoadingMesas] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.user_metadata?.role !== 'interventor') {
        router.replace('/interventor');
      } else {
        setUserEmail(session.user.email ?? null);
        loadMesas(session.user.id);
      }
    };
    checkSession();
  }, [router, supabase]);

  const loadMesas = async (userId: string) => {
    try {
      const res = await fetch('/api/interventor/mis-mesas', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (res.ok) setMesas(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMesas(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/interventor');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar Superior */}
      <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            Panel de <span className="text-emerald-700">Interventor</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Activo como</span>
            <span className="text-sm font-semibold text-gray-700">{userEmail}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Salir
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 p-8">
         <h2 className="text-xl font-bold mb-6 text-gray-800">Procesos Electorales Asignados</h2>
         {loadingMesas ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>
         ) : mesas.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-4 max-w-xl mx-auto mt-10">
              <ClipboardList className="w-16 h-16 text-gray-300" />
              <h3 className="text-xl font-bold text-gray-500">No hay procesos activos</h3>
              <p className="text-gray-400 text-sm max-w-sm">No tienes ninguna mesa electoral asignada en este momento. Cuando la administración central te asigne una unidad, aparecerá aquí automáticamente.</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {mesas.map(m => (
                 <div key={m.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col space-y-4 hover:shadow-xl hover:border-emerald-200 transition-all group">
                   <div className="flex justify-between items-start">
                     <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                        <ClipboardList className="w-6 h-6" />
                     </div>
                     <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${m.estado === 'completado' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {m.estado || 'PENDIENTE'}
                     </span>
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-gray-800 line-clamp-1" title={m.unidades_electorales?.nombre}>{m.unidades_electorales?.nombre}</h3>
                     <p className="text-emerald-700 font-bold uppercase text-xs tracking-widest mt-1">{m.nombre_identificador}</p>
                   </div>
                   <div className="pt-4 border-t border-gray-100">
                     <button onClick={() => router.push(`/interventor/mesa/${m.id}`)} className="w-full py-4 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-black rounded-2xl transition-colors uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                        Acceder al Formulario <ArrowRight className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
               ))}
            </div>
         )}
      </main>
    </div>
  );
}
