"use client";
import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Loader2,
  ChevronRight,
  ChevronDown,
  Search,
  AlertTriangle,
  Mail,
  CheckCircle2,
  ShieldCheck,
  X,
  Users
} from 'lucide-react';

const SearchableCombobox = ({ options, value, onChange, placeholder }: { options: any[], value: string, onChange: (v: string) => void, placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find(o => o.id?.toString() === value?.toString());
  const filtered = options.filter(o => (o.nombre || o.nombre_completo || '').toUpperCase().includes(term.toUpperCase()));

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)} className="w-full bg-black/40 border-2 border-white/5 rounded-[30px] px-8 py-6 flex items-center justify-between cursor-pointer focus:outline-none hover:border-emerald-500/50 appearance-none transition-all shadow-inner">
         <span className={`font-black text-sm uppercase ${selected ? 'text-white' : 'text-white/40'}`}>{selected ? (selected.nombre || selected.nombre_completo).toUpperCase() : placeholder}</span>
         <ChevronDown className={`w-6 h-6 opacity-30 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute top-[110%] left-0 w-full bg-[#111827] border border-white/20 rounded-[30px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-[60] flex flex-col backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-white/10 relative">
            <Search className="w-4 h-4 text-white/30 absolute left-8 top-1/2 -translate-y-1/2" />
            <input type="text" autoFocus className="w-full bg-black/40 text-white font-black text-xs uppercase rounded-2xl pl-12 pr-6 py-4 border-2 border-white/10 focus:outline-none focus:border-emerald-500 transition-all" placeholder="BUSCAR..." value={term} onChange={e => setTerm(e.target.value)} />
          </div>
          <div className="max-h-[300px] overflow-y-auto hidden-scrollbar">
             {filtered.length > 0 ? filtered.slice(0, 100).map(o => (
               <div key={o.id} onClick={() => { onChange(o.id.toString()); setIsOpen(false); setTerm(""); }} className="px-8 py-5 hover:bg-emerald-500/10 cursor-pointer border-b border-white/5 font-black uppercase text-[12px] text-white/50 hover:text-white transition-all flex justify-between items-center">
                 <span>{o.nombre || o.nombre_completo}</span>
                 {value === o.id?.toString() && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
               </div>
             )) : <div className="p-8 text-center text-white/30 text-[10px] uppercase font-black">SIN COINCIDENCIAS</div>}
          </div>
        </div>
      )}
    </div>
  );
};

function ConfigurarEleccionesSPA() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const unitIdFromUrl = searchParams.get('unidad_id');
  
  const [provincias, setProvincias] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [sectores, setSectores] = useState<any[]>([]);
  const [organos, setOrganos] = useState<any[]>([]);
  const [unidadesExistentes, setUnidadesExistentes] = useState<any[]>([]);
  const [interventores, setInterventores] = useState<any[]>([]);
  const [sindicatos, setSindicatos] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    provincia_id: '',
    municipio_id: '',
    sector_id: '',
    unidad_id: unitIdFromUrl || '',
    tipo_organo_id: '',
    modo_colegio: 'unico', // 'unico' | 'doble'
    del_unico: '1',
    del_tecnicos: '1',
    del_especialistas: '0',
    ccaa_id: ''
  });

  const [mesas, setMesas] = useState([{ id: Math.random().toString(), nombre: 'MESA 1', interventor_id: '', pin: Math.floor(100000 + Math.random() * 900000).toString() }]);
  const [sindicatosSeleccionados, setSindicatosSeleccionados] = useState<number[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevaUnidadNombre, setNuevaUnidadNombre] = useState('');
  const [addingUnit, setAddingUnit] = useState(false);
  
  const [isModalSindicatoOpen, setIsModalSindicatoOpen] = useState(false);
  const [nuevaUnionSiglas, setNuevaUnionSiglas] = useState('');
  const [nuevaUnionNombre, setNuevaUnionNombre] = useState('');
  const [addingUnion, setAddingUnion] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    loadMasters();
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const unit = unidadesExistentes.find(u => u.id === formData.unidad_id);
    if (unit && formData.tipo_organo_id) {
       const name = unit.nombre.toUpperCase();
       const organ = formData.tipo_organo_id; // '1'=Junta, '2'=Comité
       
       if (name.includes('JUNTA') && organ === '2') {
         setWarning("¡AVISO!: LA UNIDAD PARECE SER UNA 'JUNTA' PERO HAS ELEGIDO 'COMITÉ'");
       } else if (name.includes('COMITE') && organ === '1') {
         setWarning("¡AVISO!: LA UNIDAD PARECE SER UN 'COMITÉ' PERO HAS ELEGIDO 'JUNTA'");
       } else {
         setWarning(null);
       }
    } else {
       setWarning(null);
    }
  }, [formData.unidad_id, formData.tipo_organo_id, unidadesExistentes]);

  const loadMasters = async () => {
    setLoading(true);
    try {
      const [provRes, sectRes, organRes, unityRes, muniRes, intRes, sindRes] = await Promise.all([
        supabase.from('provincias').select('*').order('nombre'),
        supabase.from('sectores').select('*').order('nombre'),
        supabase.from('tipos_organos').select('*').order('nombre'),
        fetch('/api/admin/unidades').then(res => res.json()),
        fetch('/municipios.json').then(res => res.json()).catch(() => []),
        supabase.from('usuarios').select('*').eq('rol', 'interventor').order('nombre_completo'),
        supabase.from('sindicatos').select('*').order('orden_prioridad')
      ]);

      if (provRes.data) setProvincias(provRes.data);
      if (sectRes.data) setSectores(sectRes.data);
      if (organRes.data) setOrganos(organRes.data);
      if (unityRes) setUnidadesExistentes(unityRes);
      if (muniRes && muniRes.length) setMunicipios(muniRes.map((m: any) => ({ id: m.id, nombre: m.nm })));
      if (intRes.data) setInterventores(intRes.data);
      if (sindRes.data) setSindicatos(sindRes.data);

      if (unitIdFromUrl) {
         const { data: u } = await supabase.from('unidades_electorales').select('*').eq('id', unitIdFromUrl).single();
         if (u) {
           setFormData(f => ({
             ...f,
             unidad_id: u.id?.toString() || '',
             provincia_id: u.provincia_id?.toString() || '',
             sector_id: u.sector_id?.toString() || '',
             tipo_organo_id: u.tipo_organo_id?.toString() || '',
             ccaa_id: u.ccaa_id?.toString() || ''
           }));
         }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateDelegados = (): { valid: boolean; total: number } => {
    const isJunta = formData.tipo_organo_id === '1';
    const isComite = formData.tipo_organo_id === '2';
    const numUnico = parseInt(formData.del_unico) || 0;
    const numTec = parseInt(formData.del_tecnicos) || 0;
    const numEsp = parseInt(formData.del_especialistas) || 0;

    let total = 0;
    if (isJunta || (isComite && formData.modo_colegio === 'unico')) {
      total = numUnico;
    } else if (isComite && formData.modo_colegio === 'doble') {
      total = numTec + numEsp;
    }

    return { valid: total % 2 !== 0, total };
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.provincia_id || !formData.municipio_id || !formData.unidad_id || !formData.tipo_organo_id) {
       setError("COMPLETA LA UNIDAD ELECTORAL, EL TIPO DE ÓRGANO Y LA UBICACIÓN GEOGRÁFICA");
       return;
    }
    
    if (mesas.length === 0 || mesas.some(m => !m.nombre || !m.interventor_id)) {
        setError("TODAS LAS MESAS DEBEN TENER UN NOMBRE IDENTIFICADOR Y UN INTERVENTOR ASIGNADO");
        return;
    }

    if (sindicatosSeleccionados.length === 0) {
        setError("DEBES SELECCIONAR AL MENOS UN SINDICATO CONCURRENTE");
        return;
    }

    const { valid, total } = validateDelegados();
    if (!valid) {
       setError("EL NÚMERO TOTAL DE DELEGADOS DEBE SER IMPAR.");
       return;
    }

    setSaving(true);

    try {
      let finalCcaaId = formData.ccaa_id;
      if (!finalCcaaId) {
        const p = provincias.find(x => x.id?.toString() === formData.provincia_id);
        if (p) finalCcaaId = p.ccaa_id?.toString();
      }

      // 1. Update Unit
      const { error: saveError } = await supabase
        .from('unidades_electorales')
        .update({
           provincia_id: formData.provincia_id ? parseInt(formData.provincia_id) : null,
           sector_id: formData.sector_id ? parseInt(formData.sector_id) : null,
           tipo_organo_id: parseInt(formData.tipo_organo_id),
           delegados_a_elegir: total,
           ccaa_id: finalCcaaId ? parseInt(finalCcaaId) : null,
           estado: 'activa'
        })
        .eq('id', formData.unidad_id);

      if (saveError) throw saveError;

      // 1.5 Update Sindicatos (Limpiando duplicados locales en el array antes de subir)
      const sindicatosUnicos = Array.from(new Set(sindicatosSeleccionados.map(s => Number(s))));
      
      // Primero limpiamos los antiguos para esta unidad y comprobamos errores
      const { error: delError } = await supabase.from('unidades_sindicatos').delete().eq('unidad_id', formData.unidad_id);
      if (delError) throw delError;
      
      // Insertamos los nuevos utilizando upsert para aguantar doble-clicks o problemas de red
      if (sindicatosUnicos.length > 0) {
          const { error: sindicatosErr } = await supabase.from('unidades_sindicatos').upsert(
              sindicatosUnicos.map(sId => ({
                  unidad_id: formData.unidad_id,
                  sindicato_id: sId
              })),
              { onConflict: 'unidad_id,sindicato_id' }
          );
          if (sindicatosErr) throw sindicatosErr;
      }

      // 2. Mesas
      for (const mesa of mesas) {
          // Actualizamos PIN del asignado
          await supabase.from('usuarios').update({ pin_acceso: mesa.pin }).eq('id', mesa.interventor_id);
          
          // Guardamos o actualizamos la Mesa de forma condicional segura
          const { error: mesaErr } = await supabase.from('mesas_electorales').upsert({
              unidad_id: formData.unidad_id,
              nombre_identificador: mesa.nombre,
              interventor_id: mesa.interventor_id,
              estado: 'pendiente'
          }, { onConflict: 'unidad_id,nombre_identificador' });
          
          if (mesaErr) {
             console.error("Error guardando mesa:", mesaErr);
             throw mesaErr;
          }

          const selectedInterventor = interventores.find(i => i.id === mesa.interventor_id);
          const selectedUnit = unidadesExistentes.find(u => u.id === formData.unidad_id);

          if (selectedInterventor && selectedUnit) {
              try {
                 await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                       email: selectedInterventor.email,
                       nombre: selectedInterventor.nombre_completo,
                       pin: mesa.pin,
                       unidad: selectedUnit.nombre
                    })
                 });
              } catch(e) {
                 console.error("No se pudo enviar email pero se guardó", e);
              }
          }
      }

      setSuccess(true);
      setTimeout(() => {
         router.push('/admin/nacional/dashboard');
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getSelectedUnitLabel = () => {
    const unit = unidadesExistentes.find(u => u.id === formData.unidad_id);
    return unit ? unit.nombre.toUpperCase() : 'SELECCIONA UNIDAD ELECTORAL';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c]"><Loader2 className="w-12 h-12 text-emerald-400 animate-spin" /></div>;

  if (success) {
      return (
         <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f1c] p-6 text-center animate-in fade-in duration-500">
             <div className="w-32 h-32 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/20">
                 <CheckCircle2 className="w-16 h-16 text-emerald-400" />
             </div>
             <h2 className="text-5xl font-black uppercase text-white tracking-tighter mb-4">¡Configuración Activa!</h2>
             <p className="text-emerald-400 font-bold tracking-widest uppercase text-xs mb-8">Interventor asginado. Notificación enviada.</p>
             <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
             <p className="text-white/30 text-[10px] uppercase font-black tracking-widest mt-4">Redirigiendo al portal...</p>
         </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-6 md:p-12 relative overflow-hidden hidden-scrollbar">
      <div className="absolute inset-0 pointer-events-none origin-center">
        <div className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-emerald-600/5 rounded-full blur-[150px] opacity-30" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <Link href="/admin/nacional/dashboard" className="group flex items-center gap-2 text-white/30 hover:text-white transition-all mb-4">
              <ArrowLeft className="w-4 h-4 border border-white/10 p-2 rounded-xl bg-white/5" />
              <span className="font-black uppercase tracking-[0.4em] text-[10px]">Portal Nacional</span>
            </Link>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase leading-none">
              CONFIGURAR <span className="text-emerald-500">ELECCIONES</span>
            </h1>
          </div>
        </div>

        <div className="bg-[#111827]/40 backdrop-blur-3xl border border-white/10 p-10 md:p-14 rounded-[60px] shadow-2xl transition-all">
          <form onSubmit={handleNextStep} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] px-4">Provincia</label>
                 <SearchableCombobox 
                    options={provincias} 
                    value={formData.provincia_id} 
                    onChange={(val) => setFormData({...formData, provincia_id: val})} 
                    placeholder="SELECCIONA PROVINCIA..." 
                 />
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] px-4">Localidad</label>
                 <SearchableCombobox 
                    options={municipios} 
                    value={formData.municipio_id} 
                    onChange={(val) => setFormData({...formData, municipio_id: val})} 
                    placeholder="SELECCIONA LOCALIDAD..." 
                 />
              </div>

              <div className="md:col-span-2 relative" ref={dropdownRef}>
                 <div className="flex justify-between items-center mb-4 px-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Unidad Electoral</label>
                    <button type="button" onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase text-[9px] rounded-xl hover:bg-emerald-500 hover:text-black transition-all shadow-lg active:scale-95">Nueva +</button>
                 </div>
                 <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full bg-black/40 border-2 border-white/5 rounded-[35px] px-10 py-6 flex items-center justify-between cursor-pointer hover:border-emerald-500/50 transition-all shadow-inner">
                    <span className="font-black text-md tracking-tight uppercase">{getSelectedUnitLabel()}</span>
                    <ChevronDown className={`w-6 h-6 opacity-30 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                 </div>
                 {isDropdownOpen && (
                   <div className="absolute top-[110%] left-0 w-full bg-[#111827] border border-white/20 rounded-[35px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-50 max-h-[300px] overflow-y-auto backdrop-blur-3xl animate-in zoom-in-95 duration-200">
                      {unidadesExistentes.map(u => (
                        <div key={u.id} onClick={() => { 
                           setFormData(f => ({
                             ...f, 
                             unidad_id: u.id, 
                             provincia_id: u.provincia_id?.toString() || f.provincia_id, 
                             sector_id: u.sector_id?.toString() || f.sector_id, 
                             tipo_organo_id: u.tipo_organo_id?.toString() || f.tipo_organo_id,
                             ccaa_id: u.ccaa_id?.toString() || f.ccaa_id
                           }));
                           setIsDropdownOpen(false);
                        }} className="p-6 hover:bg-emerald-500/10 cursor-pointer border-b border-white/5 font-black uppercase text-[12px] text-white/50 hover:text-white flex items-center justify-between transition-all">
                           {u.nombre}
                        </div>
                       ))}
                   </div>
                 )}
              </div>

              <div className="md:col-span-2 space-y-4 pt-4 border-t border-white/5">
                 <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] px-4">Tipo de Órgano</label>
                 <select value={formData.tipo_organo_id} onChange={(e) => setFormData({...formData, tipo_organo_id: e.target.value})} className="w-full bg-black/40 border-2 border-white/5 rounded-[30px] px-8 py-6 focus:outline-none focus:border-emerald-500 appearance-none font-black text-sm uppercase transition-all shadow-inner">
                    <option value="">Selecciona...</option>
                    {organos.map(o => <option key={o.id} value={o.id?.toString()}>{o.nombre.toUpperCase()}</option>)}
                 </select>
              </div>

              {/* BLOQUE DELEGADOS CONDICIONAL */}
              {formData.tipo_organo_id && (
                  <div className="md:col-span-2 space-y-6 pt-4 border-t border-white/5 animate-in fade-in zoom-in-95 duration-300">
                     <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] px-4">Configuración de Delegados (Obligatorio Impar)</label>
                     
                     {formData.tipo_organo_id === '2' && (
                        <div className="flex gap-4 p-4 bg-black/20 rounded-[35px] border border-white/5">
                            <button type="button" onClick={() => setFormData({...formData, modo_colegio: 'unico'})} className={`flex-1 py-4 font-black uppercase text-[11px] rounded-3xl transition-all ${formData.modo_colegio === 'unico' ? 'bg-emerald-600 text-white' : 'text-white/40 hover:bg-white/5'}`}>Colegio Único</button>
                            <button type="button" onClick={() => setFormData({...formData, modo_colegio: 'doble'})} className={`flex-1 py-4 font-black uppercase text-[11px] rounded-3xl transition-all ${formData.modo_colegio === 'doble' ? 'bg-emerald-600 text-white' : 'text-white/40 hover:bg-white/5'}`}>Dos Colegios</button>
                        </div>
                     )}

                     <div className="grid grid-cols-2 gap-6 bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[40px]">
                        {(formData.tipo_organo_id === '1' || (formData.tipo_organo_id === '2' && formData.modo_colegio === 'unico')) ? (
                            <div className="col-span-2 space-y-4">
                               <label className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] px-4">Total Delegados Electos</label>
                               <input type="number" min="1" step="2" value={formData.del_unico} onChange={(e) => setFormData({...formData, del_unico: e.target.value})} className="w-full bg-black/40 border-2 border-white/10 rounded-3xl px-8 py-6 font-black text-2xl text-center text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all font-mono" />
                            </div>
                        ) : formData.tipo_organo_id === '2' && formData.modo_colegio === 'doble' ? (
                            <>
                              <div className="space-y-4">
                                 <label className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] px-4 text-center block">Técnicos y Admin.</label>
                                 <input type="number" min="0" value={formData.del_tecnicos} onChange={(e) => setFormData({...formData, del_tecnicos: e.target.value})} className="w-full bg-black/40 border-2 border-white/10 rounded-3xl px-8 py-6 font-black text-2xl text-center text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all font-mono" />
                              </div>
                              <div className="space-y-4">
                                 <label className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] px-4 text-center block">Especialistas No C.</label>
                                 <input type="number" min="0" value={formData.del_especialistas} onChange={(e) => setFormData({...formData, del_especialistas: e.target.value})} className="w-full bg-black/40 border-2 border-white/10 rounded-3xl px-8 py-6 font-black text-2xl text-center text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all font-mono" />
                              </div>
                              <div className="col-span-2 text-center pt-2">
                                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Suma Total: <span className="text-emerald-400 text-lg">{(parseInt(formData.del_tecnicos)||0) + (parseInt(formData.del_especialistas)||0)}</span></p>
                              </div>
                            </>
                        ) : null}
                     </div>
                  </div>
              )}

              {/* BLOQUE SINDICATOS CONCURRENTES (LISTA Y COMBO) */}
              <div className="md:col-span-2 space-y-6 pt-4 border-t border-white/5 animate-in fade-in zoom-in-95 duration-300">
                 <div className="flex items-center justify-between px-4">
                     <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-500/50" />
                        <span>Sindicatos Concurrentes</span>
                     </label>
                     <button type="button" onClick={() => setIsModalSindicatoOpen(true)} className="px-5 py-3 bg-emerald-500/10 text-emerald-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-emerald-500 hover:text-black transition-all border border-emerald-500/20 shadow-lg active:scale-95 flex gap-2 items-center">
                        Nuevo +
                     </button>
                 </div>
                 
                 <div className="flex flex-col gap-6 bg-black/20 p-8 rounded-3xl border border-white/5 shadow-inner">
                     <SearchableCombobox 
                        options={sindicatos.filter(s => !sindicatosSeleccionados.includes(s.id))} 
                        value={""} 
                        onChange={(val) => setSindicatosSeleccionados([...sindicatosSeleccionados, parseInt(val)])} 
                        placeholder="BUSCAR Y AÑADIR SINDICATO..." 
                     />
                     <div className="flex flex-wrap gap-3">
                         {sindicatosSeleccionados.map(sId => {
                             const s = sindicatos.find(x => x.id === sId);
                             if (!s) return null;
                             return (
                                 <div key={s.id} className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 pl-5 pr-2 py-2 rounded-2xl animate-in zoom-in duration-200 shadow-lg">
                                     <span className="text-emerald-400 font-black text-sm uppercase tracking-widest">{s.siglas}</span>
                                     <button type="button" onClick={() => setSindicatosSeleccionados(sindicatosSeleccionados.filter(x => x !== s.id))} className="text-emerald-400/50 hover:text-rose-500 bg-black/40 hover:bg-rose-500/20 p-2 rounded-xl transition-all">
                                         <X className="w-4 h-4" />
                                     </button>
                                 </div>
                             );
                         })}
                         {sindicatosSeleccionados.length === 0 && <p className="text-[10px] font-black text-white/20 uppercase tracking-widest w-full text-center py-4">NINGÚN SINDICATO SELECCIONADO.</p>}
                     </div>
                 </div>
              </div>

              <div className="md:col-span-2 space-y-6 pt-4 border-t border-white/5 animate-in fade-in zoom-in-95 duration-300">
                 <div className="flex items-center justify-between px-4">
                     <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500/50" />
                        <span>Mesas e Interventores</span>
                     </label>
                     <button type="button" onClick={() => setMesas([...mesas, { id: Math.random().toString(), nombre: `MESA ${mesas.length + 1}`, interventor_id: '', pin: Math.floor(100000 + Math.random() * 900000).toString() }])} className="px-5 py-3 bg-emerald-500/10 text-emerald-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-emerald-500 hover:text-black transition-all border border-emerald-500/20 shadow-lg active:scale-95 flex gap-2 items-center">
                        Añadir Mesa +
                     </button>
                 </div>
                 
                 <div className="space-y-4">
                     {mesas.map((m, idx) => (
                         <div key={m.id} className="bg-black/20 border border-white/5 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-wrap shadow-inner relative group">
                             <div className="md:col-span-3 space-y-2">
                                 <label className="text-[9px] font-black text-white/30 uppercase tracking-widest px-2">Nombre Mesa</label>
                                 <input type="text" value={m.nombre} onChange={(e) => { const newM = [...mesas]; newM[idx].nombre = e.target.value.toUpperCase(); setMesas(newM); }} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-[11px] font-black text-white uppercase focus:border-emerald-500 focus:outline-none transition-all shadow-inner" />
                             </div>
                             <div className="md:col-span-6 space-y-2 z-50">
                                 <label className="text-[9px] font-black text-white/30 uppercase tracking-widest px-2">Interventor Asignado</label>
                                 <SearchableCombobox options={interventores} value={m.interventor_id} onChange={(val) => { const newM = [...mesas]; newM[idx].interventor_id = val; setMesas(newM); }} placeholder="BUSCAR INTERVENTOR..." />
                             </div>
                             <div className="md:col-span-2 space-y-2">
                                 <label className="text-[9px] font-black text-emerald-400/50 uppercase tracking-widest px-2">PIN Acceso</label>
                                 <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-4 text-emerald-400 font-black text-[14px] tracking-[0.2em] text-center font-mono">{m.pin}</div>
                             </div>
                             <div className="md:col-span-1 pt-6 text-center">
                                 {mesas.length > 1 && (
                                     <button type="button" onClick={() => setMesas(mesas.filter(x => x.id !== m.id))} className="text-white/20 hover:text-rose-500 transition-colors p-3 rounded-full hover:bg-rose-500/10 inline-flex">
                                         <X className="w-5 h-5" />
                                     </button>
                                 )}
                             </div>
                         </div>
                     ))}
                 </div>
                 <p className="text-[9px] font-bold text-white/20 uppercase text-center mt-4 tracking-widest px-8">Los interventores asignados recibirán un correo automático con sus contraseñas (PIN) respectivas al grabar.</p>
              </div>

            </div>

            {/* ERROR Y WARNING */}
            {error && <p className="text-center text-rose-500 font-black text-[10px] uppercase py-8 border border-rose-500/10 rounded-3xl bg-rose-500/5 animate-pulse">{error}</p>}
            {warning && !error && (
              <div className="flex items-center gap-4 p-8 bg-rose-500/10 border border-rose-500/30 rounded-3xl animate-in slide-in-from-left duration-500">
                <AlertTriangle className="w-10 h-10 text-rose-500 shrink-0" />
                <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest leading-relaxed">{warning}</p>
              </div>
            )}

            <button type="submit" disabled={saving || !!warning || !formData.tipo_organo_id || !formData.unidad_id || mesas.some(m => !m.interventor_id) || sindicatosSeleccionados.length === 0} className="group w-full py-10 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-3xl rounded-[40px] shadow-[0_25px_60px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale uppercase tracking-widest">
               {saving ? <Loader2 className="animate-spin w-8 h-8" /> : <>Grabar y Notificar <Mail className="w-8 h-8 opacity-80" /></>}
            </button>
          </form>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#111827] border border-white/10 w-full max-w-lg rounded-[50px] p-12 space-y-8 relative overflow-hidden text-center">
             <div className="absolute top-0 left-0 w-full h-[150px] bg-emerald-500/10 blur-[50px] -translate-y-1/2" />
             <h2 className="text-3xl font-black text-white uppercase tracking-tighter relative z-10">Nueva Unidad</h2>
             <input type="text" value={nuevaUnidadNombre} onChange={(e) => setNuevaUnidadNombre(e.target.value.toUpperCase())} placeholder="EJ: AYUNTAMIENTO MADRID..." className="w-full bg-black/40 border-2 border-white/10 rounded-3xl px-8 py-6 text-white font-black uppercase text-sm focus:outline-none focus:border-emerald-500 transition-all relative z-10 text-center" />
             <div className="flex gap-4 relative z-10">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase text-[10px] transition-all">Cerrar</button>
                <button onClick={async () => {
                   setAddingUnit(true);
                   try {
                     const resp = await fetch('/api/admin/unidades', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ nombre: nuevaUnidadNombre }) });
                     const data = await resp.json();
                     setUnidadesExistentes([...unidadesExistentes, data]);
                     setFormData(f => ({ ...f, unidad_id: data.id }));
                     setIsModalOpen(false);
                   } catch (err: any) { setError(err.message); setIsModalOpen(false); } finally { setAddingUnit(false); }
                }} className="flex-[2] py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl uppercase text-[12px] tracking-widest transition-all">
                   {addingUnit ? <Loader2 className="animate-spin text-center w-full" /> : "Grabar Rápidamente"}
                </button>
             </div>
          </div>
        </div>
      )}

      {isModalSindicatoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#111827] border border-white/10 w-full max-w-lg rounded-[50px] p-12 space-y-8 relative overflow-hidden text-center">
             <div className="absolute top-0 left-0 w-full h-[150px] bg-emerald-500/10 blur-[50px] -translate-y-1/2" />
             <h2 className="text-3xl font-black text-white uppercase tracking-tighter relative z-10">Nuevo Sindicato</h2>
             
             <div className="space-y-4 relative z-10">
                 <input type="text" value={nuevaUnionSiglas} onChange={(e) => setNuevaUnionSiglas(e.target.value.toUpperCase())} placeholder="SIGLAS (EJ: CSIF)" className="w-full bg-black/40 border-2 border-white/10 rounded-3xl px-8 py-5 text-emerald-400 font-black uppercase text-2xl focus:outline-none focus:border-emerald-500 transition-all text-center tracking-widest placeholder:text-white/20 placeholder:text-sm" />
                 <input type="text" value={nuevaUnionNombre} onChange={(e) => setNuevaUnionNombre(e.target.value.toUpperCase())} placeholder="NOMBRE COMPLETO" className="w-full bg-black/40 border-2 border-white/10 rounded-3xl px-8 py-4 text-white font-black uppercase text-xs focus:outline-none focus:border-emerald-500 transition-all text-center placeholder:text-white/20 tracking-wider" />
             </div>

             <div className="flex gap-4 relative z-10">
                <button onClick={() => { setIsModalSindicatoOpen(false); setNuevaUnionNombre(''); setNuevaUnionSiglas(''); }} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase text-[10px] transition-all">Cancelar</button>
                <button disabled={addingUnion || !nuevaUnionSiglas || !nuevaUnionNombre} onClick={async () => {
                   setAddingUnion(true);
                   try {
                     const { data, error } = await supabase.from('sindicatos').insert({ siglas: nuevaUnionSiglas, nombre_completo: nuevaUnionNombre, orden_prioridad: 99 }).select().single();
                     if (error) throw error;
                     setSindicatos([...sindicatos, data]);
                     setSindicatosSeleccionados([...sindicatosSeleccionados, data.id]);
                     setIsModalSindicatoOpen(false);
                     setNuevaUnionSiglas('');
                     setNuevaUnionNombre('');
                   } catch (err: any) { alert(err.message); } finally { setAddingUnion(false); }
                }} className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl uppercase text-[12px] tracking-widest transition-all disabled:opacity-50">
                   {addingUnion ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : "Grabar Sindicato"}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConfigurarEleccionesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0f1c] text-white flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>}>
      <ConfigurarEleccionesSPA />
    </Suspense>
  );
}
