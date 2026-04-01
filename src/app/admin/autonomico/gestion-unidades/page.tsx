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
  BarChart2,
  MapPin,
  Building2,
  Layers
} from 'lucide-react';

export default function GestionUnidadesAutonomicoPage() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<string>('all');
  const [userData, setUserData] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Obtener datos del usuario logueado (para saber su CCAA)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const ccaaId = session.user.user_metadata?.ccaa_id;
      setUserData(session.user.user_metadata);

      // 2. Cargar unidades filtradas por CCAA
      const { data, error } = await supabase
        .from('unidades_electorales')
        .select(`
          *,
          ccaa(nombre),
          provincias(nombre),
          sectores(nombre),
          tipos_organos(nombre)
        `)
        .eq('ccaa_id', ccaaId)
        .order('nombre', { ascending: true });
      
      if (error) throw error;
      setUnidades(data || []);
    } catch (err) {
      console.error('Error cargando unidades:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUnidad = async (id: string, nombre: string) => {
    if (!confirm(`¿ESTÁS SEGURO DE ELIMINAR LA UNIDAD "${nombre.toUpperCase()}"?`)) return;
    try {
      const { error } = await supabase.from('unidades_electorales').delete().eq('id', id);
      if (error) throw error;
      setUnidades(unidades.filter(u => u.id !== id));
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'configuracion':
        return { icon: <Clock className="w-3 h-3" />, text: 'Borrador', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      case 'activa':
        return { icon: <CheckCircle2 className="w-3 h-3" />, text: 'Activa', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' };
      case 'escrutinio':
        return { icon: <BarChart2 className="w-3 h-3" />, text: 'Escrutinio', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      default:
        return { icon: null, text: estado, class: 'bg-white/5 text-white/40' };
    }
  }

  const filtered = unidades.filter(u => {
    const matchesSearch = u.nombre.toUpperCase().includes(searchTerm.toUpperCase()) || 
                         u.provincias?.nombre.toUpperCase().includes(searchTerm.toUpperCase());
    const matchesFilter = filterState === 'all' || u.estado === filterState;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#0a101f] text-white p-6 md:p-12 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <Link href="/admin/autonomico/dashboard" className="group flex items-center gap-2 text-white/30 hover:text-white transition-colors mb-6">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-black uppercase tracking-[0.2em] text-[10px]">Portal Auton&oacute;mico</span>
            </Link>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
              Control Regional <br />
              <span className="text-black bg-blue-400 px-4 py-1 inline-block -skew-x-6 mt-2">{userData?.comunidad || 'CSIF'}</span>
            </h1>
          </div>
          <div className="p-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-3xl">
             <Database className="w-10 h-10 text-blue-400" />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-10">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
            <input 
              type="text" 
              placeholder="Filtro rápido por provincia o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[35px] pl-16 pr-8 py-6 focus:outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-white/10 uppercase text-sm tracking-tight"
            />
          </div>
          <div className="md:col-span-4">
            <select 
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[35px] px-8 py-6 focus:outline-none appearance-none font-black uppercase text-[10px] tracking-widest text-white/60"
            >
              <option value="all">Estado: Todos</option>
              <option value="activa">Estado: Activa</option>
              <option value="configuracion">Estado: Borrador</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-[45px] animate-pulse border border-white/5" />
            ))
          ) : filtered.length > 0 ? (
            filtered.map((u) => {
              const badge = getStatusBadge(u.estado);
              return (
                <div key={u.id} className="group relative bg-[#131a2c] border border-white/10 p-8 rounded-[45px] hover:border-blue-500/30 transition-all duration-500 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                  <div className="flex justify-between items-start mb-10">
                    <div className={`px-4 py-2 rounded-full border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${badge.class}`}>
                      {badge.icon} {badge.text}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => deleteUnidad(u.id, u.nombre)}
                        className="p-3 bg-white/5 rounded-2xl hover:bg-rose-500 text-white/30 hover:text-white transition-all shadow-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 mb-8">
                    <h3 className="text-2xl font-black leading-tight tracking-tighter uppercase min-h-[3rem]">{u.nombre}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-8 border-b border-white/5">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em]">Sectores</p>
                      <div className="flex items-center gap-2 text-white/80 font-bold text-xs">
                        <Building2 className="w-4 h-4 text-blue-400/50 shrink-0" /> {u.sectores?.nombre || 'General'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em]">Órgano</p>
                      <div className="flex items-center gap-2 text-white/80 font-bold text-xs truncate">
                        <Layers className="w-4 h-4 text-blue-400/50 shrink-0" /> {u.tipos_organos?.nombre}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-8">
                     <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] font-black uppercase text-white/50">{u.provincias?.nombre}</span>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">Delegados</p>
                        <p className="text-2xl font-black text-white leading-none mt-1">{u.delegados_a_elegir}</p>
                     </div>
                  </div>
                </div>
              );
            })
          ) : (
             <div className="col-span-full py-20 bg-white/5 border border-dashed border-white/10 rounded-[60px] flex flex-col items-center justify-center gap-4">
                <Layers className="w-12 h-12 text-white/10" />
                <p className="font-black uppercase tracking-widest text-white/20">Sin unidades en {userData?.comunidad}</p>
             </div>
          )}
        </div>
      </div>
      
      <footer className="relative z-10 mt-20 pb-12 text-center text-white/10 text-[9px] font-black uppercase tracking-[0.3em]">
        CSIF · ControlRegional · Frankfurt Hub
      </footer>
    </div>
  );
}
