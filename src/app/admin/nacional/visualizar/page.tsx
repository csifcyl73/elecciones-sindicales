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
  Database,
  CalendarRange,
  Building2,
  Layers,
  MapPin,
  FolderOpen
} from 'lucide-react';

export default function VisualizarEleccionesPage() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Cargar las unidades que tengan al menos una mesa con 'votos_candidaturas'
      // O mas bien, todas las elecciones "activas" o "en escrutinio" o "finalizadas"
      const { data, error } = await supabase
        .from('unidades_electorales')
        .select(`
          *,
          proceso:procesos_electorales(nombre, periodo),
          provincias(nombre),
          sectores(nombre),
          tipos_organos(nombre),
          ccaa(nombre)
        `)
        .in('estado', ['activa', 'escrutinio', 'finalizada', 'congelada'])
        .order('nombre', { ascending: true });

      if (error) throw error;
      setUnidades(data || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = unidades.filter(u => {
    const term = searchTerm.toUpperCase();
    return u.nombre.toUpperCase().includes(term) || 
           (u.provincias?.nombre || '').toUpperCase().includes(term) ||
           (u.proceso?.nombre || '').toUpperCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-[#0a101f] text-white p-6 md:p-12 relative overflow-x-hidden">
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
              <span className="text-black bg-rose-400 px-4 py-1 inline-block -skew-x-6 mt-2">Elecciones</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">Escrutadas</p>
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
            placeholder="Buscar por elección, provincia, proceso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-[35px] pl-16 pr-8 py-6 focus:outline-none focus:border-rose-500/50 transition-all font-bold placeholder:text-white/10 uppercase text-sm tracking-tight"
          />
        </div>

        {/* Listado */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 text-rose-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 bg-white/5 border border-dashed border-white/10 rounded-[60px] flex flex-col items-center justify-center gap-6">
            <div className="p-8 bg-white/5 rounded-[40px]">
              <FolderOpen className="w-16 h-16 text-white/10" />
            </div>
            <div className="text-center">
              <h4 className="text-2xl font-black uppercase tracking-tighter text-white/40">Sin resultados</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-2">No hay elecciones activas o escrutadas en el sistema.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((u) => (
              <Link 
                href={`/admin/nacional/visualizar/${u.id}`} 
                key={u.id}
                className="group flex flex-col md:flex-row justify-between md:items-center bg-[#111827]/40 border border-white/5 hover:border-rose-500/30 rounded-[30px] p-6 transition-all hover:bg-[#111827]/80 hover:shadow-[0_10px_40px_rgba(225,29,72,0.1)] gap-6"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    {u.estado === 'congelada' ? (
                       <span className="px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                         Resultados Oficiales
                       </span>
                    ) : (
                       <span className="px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Escrutinio Abierto
                       </span>
                    )}
                    
                    {u.proceso && (
                      <span className="px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400/80 text-[9px] font-black uppercase tracking-widest break-words line-clamp-2">
                        {u.proceso.nombre}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-black uppercase tracking-tight truncate leading-tight mt-2">{u.nombre}</h3>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                       <MapPin className="w-3 h-3 text-rose-400/50" /> {u.provincias?.nombre || 'General'}
                    </div>
                    <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                       <Building2 className="w-3 h-3 text-rose-400/50" /> {u.sectores?.nombre || 'General'}
                    </div>
                    <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                       <Layers className="w-3 h-3 text-rose-400/50" /> {u.tipos_organos?.nombre || 'General'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 md:pl-6 md:border-l border-white/5 shrink-0">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Delegados</p>
                    <p className="text-2xl font-black text-rose-400">{u.delegados_a_elegir}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-rose-500 transition-colors">
                    <ChevronRight className="w-6 h-6 text-white/30 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
