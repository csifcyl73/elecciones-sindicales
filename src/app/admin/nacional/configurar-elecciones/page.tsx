"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  Building2, 
  Users, 
  Plus, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  X,
  Database,
  Trash2
} from 'lucide-react';

export default function ConfigurarEleccionesPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Estados para datos maestros
  const [provincias, setProvincias] = useState<any[]>([]);
  const [sectores, setSectores] = useState<any[]>([]);
  const [organos, setOrganos] = useState<any[]>([]);
  const [unidadesExistentes, setUnidadesExistentes] = useState<any[]>([]);
  
  // Formulario principal
  const [formData, setFormData] = useState({
    provincia_id: '',
    sector_id: '',
    unidad_id: '',
    tipo_organo_id: '',
  });

  // Modal y Gestión de Unidades
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevaUnidadNombre, setNuevaUnidadNombre] = useState('');
  const [addingUnit, setAddingUnit] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMasters();
    
    // Cerrar dropdown al hacer click fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [router, supabase]);

  const loadMasters = async () => {
    setLoading(true);
    try {
      const [provRes, sectRes, organRes, unityRes] = await Promise.all([
        supabase.from('provincias').select('*').order('nombre'),
        supabase.from('sectores').select('*').order('nombre'),
        supabase.from('tipos_organos').select('*').order('nombre'),
        fetch('/api/admin/unidades').then(res => res.json())
      ]);

      if (provRes.data) setProvincias(provRes.data);
      if (sectRes.data) setSectores(sectRes.data);
      if (organRes.data) setOrganos(organRes.data);
      if (unityRes) setUnidadesExistentes(Array.isArray(unityRes) ? unityRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaUnidadNombre.trim()) return;
    setAddingUnit(true);
    try {
      const response = await fetch('/api/admin/unidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevaUnidadNombre, provincia_id: formData.provincia_id, sector_id: formData.sector_id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUnidadesExistentes([...unidadesExistentes, data]);
      setFormData({ ...formData, unidad_id: data.id.toString() });
      setNuevaUnidadNombre('');
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setAddingUnit(false);
    }
  };

  const handleDeleteUnit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar seleccionar al borrar
    if (!confirm('¿Est&aacute;s seguro de borrar esta unidad permanentemente?')) return;
    try {
      const response = await fetch(`/api/admin/unidades?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al borrar');
      setUnidadesExistentes(unidadesExistentes.filter(u => u.id !== id));
      if (formData.unidad_id === id) setFormData({ ...formData, unidad_id: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getSelectedUnitLabel = () => {
    const unit = unidadesExistentes.find(u => u.id === formData.unidad_id);
    return unit ? unit.nombre.toUpperCase() : 'SELECCIONA UNIDAD';
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (!formData.unidad_id) throw new Error('Debes seleccionar una unidad electoral.');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSaving(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
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
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-900/10 blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/admin/nacional/dashboard" className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-semibold uppercase tracking-widest text-sm text-[11px]">VOLVER AL PANEL</span>
          </Link>
          <div className="text-right">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent uppercase">
              CONFIGURAR ELECCIONES
            </h1>
            <p className="text-white/40 text-sm mt-1 uppercase font-bold text-[10px] tracking-widest">PASO 1: PAR&Aacute;METROS GENERALES</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[32px] shadow-2xl">
          <form onSubmit={handleNextStep} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Provincia */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-widest px-1">
                  <MapPin className="w-4 h-4" /> Provincia
                </label>
                <select
                  value={formData.provincia_id}
                  onChange={(e) => setFormData({ ...formData, provincia_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white cursor-pointer hover:bg-white/10 uppercase font-bold"
                  required
                >
                  <option value="" disabled className="bg-[#0a0f1c]">SELECCIONA PROVINCIA</option>
                  {provincias.map(p => <option key={p.id} value={p.id} className="bg-[#0a0f1c]">{p.nombre.toUpperCase()}</option>)}
                </select>
              </div>

              {/* Sector */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-widest px-1">
                  <Briefcase className="w-4 h-4" /> Sector
                </label>
                <select
                  value={formData.sector_id}
                  onChange={(e) => setFormData({ ...formData, sector_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white cursor-pointer hover:bg-white/10 uppercase font-bold"
                  required
                >
                  <option value="" disabled className="bg-[#0a0f1c]">SELECCIONA SECTOR</option>
                  {sectores.map(s => <option key={s.id} value={s.id} className="bg-[#0a0f1c]">{s.nombre.toUpperCase()}</option>)}
                </select>
              </div>

              {/* Unidad Electoral (Selector Personalizado con Papelera) */}
              <div className="space-y-3 md:col-span-2 relative" ref={dropdownRef}>
                <div className="flex justify-between items-center px-1">
                  <label className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-widest">
                    <Building2 className="w-4 h-4" /> Unidad Electoral
                  </label>
                  <button type="button" onClick={() => setIsModalOpen(true)} className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-400/10 px-3 py-1.5 rounded-full border border-blue-400/20 uppercase tracking-tighter">
                    Dar de alta nueva +
                  </button>
                </div>

                {/* Dropdown Custom */}
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="relative w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all border-emerald-500/20"
                >
                  <span className="font-bold text-white tracking-wide">{getSelectedUnitLabel()}</span>
                  <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isDropdownOpen && (
                  <div className="absolute top-[102%] left-0 w-full bg-[#111827] border border-white/10 rounded-[24px] overflow-hidden shadow-2xl z-[50] max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200 backdrop-blur-3xl">
                    {unidadesExistentes.length === 0 ? (
                      <div className="p-6 text-center text-white/20 italic text-sm">NO HAY UNIDADES CARGADAS</div>
                    ) : (
                      unidadesExistentes
                        .filter(u => (!formData.provincia_id || u.provincia_id === parseInt(formData.provincia_id)))
                        .map(u => (
                          <div 
                            key={u.id}
                            onClick={() => { setFormData({ ...formData, unidad_id: u.id }); setIsDropdownOpen(false); }}
                            className="flex items-center justify-between p-4 hover:bg-white/5 group transition-colors cursor-pointer border-b border-white/5 last:border-none"
                          >
                            <span className={`font-bold transition-all ${formData.unidad_id === u.id ? 'text-emerald-400 scale-105 ml-2' : 'text-white/60 group-hover:text-white'}`}>
                              {u.nombre.toUpperCase()}
                            </span>
                            <button 
                              onClick={(e) => handleDeleteUnit(u.id, e)}
                              className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-all"
                              title="Borrar unidad"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>

              {/* Tipo de Órgano */}
              <div className="space-y-3 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-widest px-1">
                  <Users className="w-4 h-4" /> Tipo de &Oacute;rgano
                </label>
                <select
                  value={formData.tipo_organo_id}
                  onChange={(e) => setFormData({ ...formData, tipo_organo_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white cursor-pointer hover:bg-white/10 uppercase font-bold"
                  required
                >
                  <option value="" disabled className="bg-[#0a0f1c]">SELECCIONA &Oacute;RGANO</option>
                  {organos.map(o => <option key={o.id} value={o.id} className="bg-[#0a0f1c]">{o.nombre.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-sm font-bold uppercase">{error}</div>}
            
            <button
              type="submit"
              disabled={saving}
              className="w-full py-5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xl rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Siguiente <ChevronRight className="w-6 h-6" /></>}
            </button>
          </form>
        </div>
      </div>

      {/* MODAL: Alta de Nueva Unidad */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="bg-[#111827] border border-white/10 w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                  <Plus className="w-5 h-5 text-blue-400" /> Nueva Unidad Electoral
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Nombre de la unidad electoral</label>
                  <input
                    type="text"
                    value={nuevaUnidadNombre}
                    onChange={(e) => setNuevaUnidadNombre(e.target.value.toUpperCase())}
                    placeholder="EJ: JUNTA DE PERSONAL SANIDAD SEGOVIA"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500 transition-all text-white placeholder:text-white/10 font-bold"
                  />
                </div>
              </div>
              <button
                onClick={handleAddUnit}
                disabled={addingUnit || !nuevaUnidadNombre.trim()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest"
              >
                {addingUnit ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Database className="w-5 h-5" /> Grabar Unidad</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="relative z-10 mt-12 text-center text-white/20 text-[10px] font-bold uppercase tracking-widest">
        CSIF · Sistema de Gesti&oacute;n Electoral · Administrador Nacional
      </footer>
    </div>
  );
}
