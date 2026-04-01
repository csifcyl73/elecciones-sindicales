"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Database, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Building2,
  BarChart2,
  Layers
} from 'lucide-react';

export default function GestionUnidadesPage() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<string>('all');
  const supabase = createClient();

  useEffect(() => {
    loadUnidades();
  }, []);

  const loadUnidades = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('unidades_electorales')
        .select(`
          *,
          ccaa(nombre),
          provincias(nombre),
          sectores(nombre),
          tipos_organos(nombre)
        `)
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
    if (!confirm(`¿ESTÁS SEGURO DE ELIMINAR LA UNIDAD "${nombre.toUpperCase()}"? ESTA ACCIÓN ES IRREVERSIBLE.`)) return;
    try {
      const { error } = await supabase.from('unidades_electorales').delete().eq('id', id);
      if (error) throw error;
      setUnidades(unidades.filter(u => u.id !== id));
    } catch (err: any) {
      alert('Error eliminando: ' + err.message);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'configuracion':
        return { 
          icon: <Clock className="w-3 h-3" />, 
          text: 'Borrador', 
          class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
        };
      case 'activa':
        return { 
          icon: <CheckCircle2 className="w-3 h-3" />, 
          text: 'Activa', 
          class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
        };
      case 'escrutinio':
        return { 
          icon: <BarChart2 className="w-3 h-3" />, 
          text: 'Escrutinio', 
          class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
        };
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
      {/* Background Decor */}
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
              <span className="font-black uppercase tracking-[0.2em] text-[10px]">Portal Nacional</span>
            </Link>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
              Gestor de <br />
              <span className="text-black bg-emerald-400 px-4 py-1 inline-block -skew-x-6 mt-2">Unidades</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">Total Elecciones</p>
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
              placeholder="Buscar unidad por nombre, provincia o sector..."
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

        {/* Units Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-[45px] animate-pulse border border-white/5" />
            ))
          ) : filtered.length > 0 ? (
            filtered.map((u) => {
              const badge = getStatusBadge(u.estado);
              return (
                <div key={u.id} className="group relative bg-[#131a2c] border border-white/10 p-8 rounded-[45px] hover:border-emerald-500/30 transition-all duration-500 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-emerald-500/5 hover:-translate-y-1">
                  
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-10">
                    <div className={`px-4 py-2 rounded-full border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${badge.class}`}>
                      {badge.icon} {badge.text}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      {u.estado === 'configuracion' && (
                        <Link href={`/admin/nacional/configurar-elecciones/junta-personal?unidad_id=${u.id}`} className="p-3 bg-white/5 rounded-2xl hover:bg-emerald-500 hover:text-black transition-all">
                          <Edit3 className="w-5 h-5" />
                        </Link>
                      )}
                      <button 
                        onClick={() => deleteUnidad(u.id, u.nombre)}
                        className="p-3 bg-white/5 rounded-2xl hover:bg-rose-500 text-white/30 hover:text-white transition-all shadow-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Main Title */}
                  <div className="space-y-2 mb-10">
                    <h3 className="text-2xl font-black leading-tight tracking-tighter uppercase line-clamp-2 min-h-[3rem]">
                      {u.nombre}
                    </h3>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 pb-8 border-b border-white/5">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em]">Sectores</p>
                      <div className="flex items-center gap-2 text-white/80 font-bold text-xs truncate">
                        <Building2 className="w-4 h-4 text-emerald-400/50 shrink-0" /> {u.sectores?.nombre || 'General'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em]">Órgano</p>
                      <div className="flex items-center gap-2 text-white/80 font-bold text-xs truncate">
                        <Layers className="w-4 h-4 text-emerald-400/50 shrink-0" /> {u.tipos_organos?.nombre || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="flex items-center justify-between pt-8">
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                           <MapPin className="w-4 h-4 text-emerald-400" />
                           <span className="text-[10px] font-black uppercase text-white/50">{u.provincias?.nombre}</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">Delegados</p>
                        <p className="text-2xl font-black text-white leading-none mt-1">{u.delegados_a_elegir}</p>
                     </div>
                  </div>

                  {/* Icon Gradient Decor */}
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500" />
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 bg-white/5 border border-dashed border-white/10 rounded-[60px] flex flex-col items-center justify-center gap-6">
                <div className="p-8 bg-white/5 rounded-[40px]">
                  <Layers className="w-16 h-16 text-white/10" />
                </div>
                <div className="text-center">
                  <h4 className="text-2xl font-black uppercase tracking-tighter text-white/40">Sin resultados activos</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-2">Prueba a cambiar los filtros o el t&eacute;rmino de b&uacute;squeda</p>
                </div>
            </div>
          )}
        </div>
      </div>

      <footer className="relative z-10 mt-20 pb-12 text-center text-white/10 text-[9px] font-black uppercase tracking-[0.3em]">
        CSIF · Sistema de Control Electoral Global · 2026 Frankfurt Hub
      </footer>
    </div>
  );
}
