"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  Plus, 
  Loader2,
  ChevronRight,
  ChevronDown,
  X,
  Search,
  CheckCircle2,
  Trash2,
  Briefcase,
  Users
} from 'lucide-react';

export default function ComiteEmpresaConfigPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [unidadId, setUnidadId] = useState(searchParams.get('unidad_id'));
  const [unidadesExistentes, setUnidadesExistentes] = useState<any[]>([]);
  const [sindicatosMaestros, setSindicatosMaestros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado Formulario
  const [sindicatosSeleccionados, setSindicatosSeleccionados] = useState<any[]>([]);
  const [colegioTipo, setColegioTipo] = useState('UNICO'); // UNICO | DOS
  const [delegadosUnico, setDelegadosUnico] = useState('');
  const [delegadosTecnicos, setDelegadosTecnicos] = useState('');
  const [delegadosEspecialistas, setDelegadosEspecialistas] = useState('');
  
  // Buscador de Sindicatos
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar Maestros (Unidades desde API segura para saltar RLS)
      const [unionRes, unityRes] = await Promise.all([
        supabase.from('sindicatos').select('*').order('orden_prioridad', { ascending: true }),
        fetch('/api/admin/unidades').then(res => res.json())
      ]);

      if (unionRes.data) setSindicatosMaestros(unionRes.data);
      if (unityRes) setUnidadesExistentes(Array.isArray(unityRes) ? unityRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentUnitName = unidadesExistentes.find(u => u.id === unidadId)?.nombre?.toUpperCase() || 'SIN SELECCIONAR';

  const filteredSindicatos = sindicatosMaestros.filter(s => 
    s.nombre_completo.toUpperCase().includes(searchTerm.toUpperCase()) || 
    s.siglas.toUpperCase().includes(searchTerm.toUpperCase())
  ).filter(s => !sindicatosSeleccionados.find(sel => sel.id === s.id));

  const addSindicato = (s: any) => {
    setSindicatosSeleccionados([...sindicatosSeleccionados, s]);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const removeSindicato = (id: number) => {
    setSindicatosSeleccionados(sindicatosSeleccionados.filter(s => s.id !== id));
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Configuración completada con éxito. Registrando parámetros...');
    // Lógica futura de persistencia de configuración de Comité
    router.push('/admin/nacional/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c]">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-900/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/admin/nacional/configurar-elecciones" className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-semibold uppercase tracking-widest text-[11px]">VOLVER AL PASO 1</span>
          </Link>
          <div className="text-right">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-emerald-400 uppercase">
              COMIT&Eacute; DE EMPRESA
            </h1>
            <p className="text-white/40 text-[10px] mt-1 uppercase font-bold tracking-widest">
              UNIDAD: <span className="text-white/80">{currentUnitName}</span>
            </p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[40px] shadow-2xl space-y-10">
          
          {/* SECCIÓN 1: SINDICATOS QUE CONCURREN */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <Briefcase className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-black text-xl text-white uppercase tracking-tight">SINDICATOS QUE CONCURREN</h3>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">BUSCA LOS SINDICATOS QUE SE PRESENTAN</p>
              </div>
            </div>

            <div className="relative" ref={dropdownRef}>
              <div className="relative w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="ESCRIBE SIGLAS O NOMBRE DEL SINDICATO..."
                  value={searchTerm}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => { setSearchTerm(e.target.value.toUpperCase()); setIsDropdownOpen(true); }}
                  className="w-full bg-white/5 border border-white/10 rounded-[20px] pl-16 pr-8 py-5 focus:outline-none focus:border-emerald-500 transition-all text-white font-bold placeholder:text-white/10"
                />
              </div>

              {isDropdownOpen && filteredSindicatos.length > 0 && (
                <div className="absolute top-[105%] left-0 w-full bg-[#111827] border border-white/10 rounded-[24px] overflow-hidden shadow-2xl z-[50] max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200">
                  {filteredSindicatos.map(s => (
                    <div 
                      key={s.id}
                      onClick={() => addSindicato(s)}
                      className="flex items-center justify-between p-5 hover:bg-emerald-500/10 group transition-colors cursor-pointer border-b border-white/5 last:border-none"
                    >
                      <div className="flex flex-col">
                        <span className="font-black text-white group-hover:text-emerald-400 transition-all text-sm">{s.siglas.toUpperCase()}</span>
                        <span className="text-[10px] text-white/40 group-hover:text-white/60 font-bold">{s.nombre_completo.toUpperCase()}</span>
                      </div>
                      <Plus className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de Sindicatos Seleccionados */}
            <div className="flex flex-wrap gap-3">
              {sindicatosSeleccionados.map(s => (
                <div key={s.id} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full group animate-in zoom-in-90 duration-200">
                  <span className="font-bold text-xs text-emerald-400">{s.siglas.toUpperCase()}</span>
                  <button onClick={() => removeSindicato(s.id)} className="text-white/20 hover:text-rose-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {sindicatosSeleccionados.length === 0 && <p className="text-white/10 text-xs italic p-2 font-bold uppercase tracking-widest">A&Uacute;N NO HAS SELECCIONADO SINDICATOS</p>}
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* SECCIÓN 2: COLEGIOS Y DELEGADOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-white uppercase tracking-tight">COLEGIOS</h3>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">TIPO DE DISTRIBUCI&Oacute;N</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  type="button"
                  onClick={() => setColegioTipo('UNICO')}
                  className={`flex items-center justify-between px-6 py-5 rounded-[20px] border transition-all ${colegioTipo === 'UNICO' ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-lg' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  <span className="font-black tracking-widest text-sm">COLEGIO &Uacute;NICO</span>
                  {colegioTipo === 'UNICO' && <CheckCircle2 className="w-5 h-5" />}
                </button>
                <button 
                  type="button"
                  onClick={() => setColegioTipo('DOS')}
                  className={`flex items-center justify-between px-6 py-5 rounded-[20px] border transition-all ${colegioTipo === 'DOS' ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-lg' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  <span className="font-black tracking-widest text-sm">DOS COLEGIOS</span>
                  {colegioTipo === 'DOS' && <CheckCircle2 className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
                  <Building2 className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-white uppercase tracking-tight">DELEGADOS</h3>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">A ELEGIR POR COLEGIO</p>
                </div>
              </div>

              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {colegioTipo === 'UNICO' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1 text-center block">GENERAL</label>
                    <input
                      type="number"
                      placeholder="N&Uacute;MERO DE DELEGADOS"
                      value={delegadosUnico}
                      onChange={(e) => setDelegadosUnico(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-[20px] px-8 py-5 focus:outline-none focus:border-teal-500 transition-all text-white text-center font-black text-2xl"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1 text-center block">T&Eacute;CNICOS Y ADMINISTRATIVOS</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={delegadosTecnicos}
                        onChange={(e) => setDelegadosTecnicos(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-[20px] px-8 py-5 focus:outline-none focus:border-blue-500 transition-all text-white text-center font-black text-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1 text-center block">ESPECIALISTAS Y NO CUALIFICADOS</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={delegadosEspecialistas}
                        onChange={(e) => setDelegadosEspecialistas(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-[20px] px-8 py-5 focus:outline-none focus:border-teal-500 transition-all text-white text-center font-black text-2xl"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="w-full py-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-2xl rounded-3xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            Finalizar Configuraci&oacute;n
          </button>
        </div>
      </div>

      <footer className="relative z-10 mt-12 text-center text-white/20 text-[10px] font-bold uppercase tracking-widest">
        CSIF · SISTEMA DE GESTI&Oacute;N ELECTORAL · PASO 2.1 COMIT&Eacute; DE EMPRESA
      </footer>
    </div>
  );
}
