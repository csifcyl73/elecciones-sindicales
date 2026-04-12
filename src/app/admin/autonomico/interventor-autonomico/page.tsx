"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  Loader2,
  Database,
  Building2,
  MapPin,
  ClipboardList,
  ArrowRight,
  ShieldCheck,
  User,
  Settings
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

export default function InterventorAutonomicoDashboard() {
  const router = useRouter();
  const [mesas, setMesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadAllMesas();
  }, []);

  const loadAllMesas = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userComunidad = session?.user?.user_metadata?.comunidad || '';

      const res = await fetch(`/api/admin/autonomico/unidades?comunidad=${encodeURIComponent(userComunidad)}`);
      const unidades = await res.json();
      
      const allMesas: any[] = [];
      unidades.forEach((u: any) => {
        if (u.estado !== 'congelada' && u.mesas_electorales) {
          u.mesas_electorales.forEach((m: any) => {
            allMesas.push({
              ...m,
              unidad_nombre: u.nombre,
              provincia: u.provincias?.nombre || 'General',
              sector: u.sectores?.nombre || 'General',
              interventor_nombre: m.usuarios?.nombre_completo || 'Sin asignar'
            });
          });
        }
      });
      
      setMesas(allMesas);
    } catch (err) {
      console.error('Error cargando mesas:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = mesas.filter(m => {
    const term = searchTerm.toUpperCase();
    return m.unidad_nombre.toUpperCase().includes(term) || 
           m.nombre_identificador.toUpperCase().includes(term) ||
           m.interventor_nombre.toUpperCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-[#0a101f] text-white p-4 md:p-12 relative overflow-x-hidden">
      {/* Fondos decorativos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <Link href="/admin/autonomico/dashboard" className="group flex items-center gap-2 text-white/30 hover:text-white transition-colors mb-6">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:border-white/20">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-black uppercase tracking-[0.2em] text-[10px]">Portal Autonómico</span>
            </Link>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
              Intervención <br />
              <span className="text-black bg-emerald-400 px-4 py-2 inline-block -skew-x-6 mt-2">Autonómica</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">Mesas Disponibles para Carga</p>
                <p className="text-4xl font-black text-white leading-none mt-1">{mesas.length}</p>
             </div>
             <div className="p-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <ShieldCheck className="w-10 h-10 text-emerald-400" />
             </div>
          </div>
        </div>

        {/* ALERTA MODO DIOS */}
        <div className="mb-10 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[35px] flex items-center gap-6">
           <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Settings className="w-6 h-6 text-emerald-400 animate-spin-slow" />
           </div>
           <div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">Modo Administrador Nacional Activado</p>
              <p className="text-sm text-white/60 font-medium">Desde este módulo puedes suplementar la labor de cualquier interventor. Los datos grabados aquí tendrán validez oficial inmediata.</p>
           </div>
        </div>

        {/* Buscador */}
        <div className="mb-10 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por unidad, mesa o interventor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-[35px] pl-16 pr-8 py-5 md:py-6 focus:outline-none focus:border-emerald-500/50 transition-all font-bold placeholder:text-white/10 uppercase text-xs md:text-sm tracking-tight"
          />
        </div>

        {/* Listado de Mesas */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 bg-white/5 border border-dashed border-white/10 rounded-[60px] flex flex-col items-center justify-center gap-6 text-center">
            <Database className="w-16 h-16 text-white/10" />
            <p className="text-xl font-black uppercase text-white/20">No se han encontrado mesas activas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((m: any) => (
              <div key={m.id} className="bg-[#111827]/40 border border-white/5 hover:border-emerald-500/30 rounded-[40px] p-8 transition-all hover:bg-[#111827]/80 group relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                      <ClipboardList className="w-6 h-6 text-emerald-400" />
                   </div>
                   <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${m.estado === 'enviada' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {m.estado === 'enviada' ? 'YA COMPLETADA' : 'PENDIENTE'}
                   </span>
                </div>

                <div className="space-y-4 mb-8">
                   <h3 className="text-xl font-black uppercase tracking-tight leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2 min-h-[3.5rem]">{m.unidad_nombre}</h3>
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-widest">
                         <MapPin className="w-3 h-3 text-emerald-500/50" /> {m.provincia}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400/80 uppercase tracking-widest bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/10 w-fit">
                         {m.nombre_identificador}
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                         <User className="w-4 h-4 text-white/30" />
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Interventor Titular</p>
                         <p className="text-[10px] font-bold text-white/60 truncate max-w-[150px]">{m.interventor_nombre}</p>
                      </div>
                   </div>

                   <button 
                    onClick={() => router.push(`/admin/nacional/interventor-nacional/mesa/${m.id}`)}
                    className="w-full py-4 bg-white/5 hover:bg-emerald-500 text-white hover:text-black font-black rounded-2xl transition-all uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2"
                   >
                      ACCEDER AL FORMULARIO <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
