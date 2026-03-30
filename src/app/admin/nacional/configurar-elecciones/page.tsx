"use client";
import React, { useEffect, useState } from 'react';
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
  Save, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  Database
} from 'lucide-react';

export default function ConfigurarEleccionesPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Estados para datos maestros
  const [provincias, setProvincias] = useState<any[]>([]);
  const [sectores, setSectores] = useState<any[]>([]);
  const [organos, setOrganos] = useState<any[]>([]);
  const [unidadesExistentes, setUnidadesExistentes] = useState<any[]>([]);
  
  // Estados del formulario principal
  const [formData, setFormData] = useState({
    provincia_id: '',
    sector_id: '',
    unidad_id: '',
    tipo_organo_id: '',
  });

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevaUnidadNombre, setNuevaUnidadNombre] = useState('');
  const [addingUnit, setAddingUnit] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMasters();
  }, [router, supabase]);

  const loadMasters = async () => {
    setLoading(true);
    // 1. Cargar Maestros
    const [provRes, sectRes, organRes, unityRes] = await Promise.all([
      supabase.from('provincias').select('*').order('nombre'),
      supabase.from('sectores').select('*').order('nombre'),
      supabase.from('tipos_organos').select('*').order('nombre'),
      supabase.from('unidades_electorales').select('*').order('nombre')
    ]);

    if (provRes.data) setProvincias(provRes.data);
    if (sectRes.data) setSectores(sectRes.data);
    if (organRes.data) setOrganos(organRes.data);
    if (unityRes.data) setUnidadesExistentes(unityRes.data);
    
    setLoading(false);
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaUnidadNombre.trim()) return;

    setAddingUnit(true);
    try {
      const { data, error: unityError } = await supabase
        .from('unidades_electorales')
        .insert([{
          nombre: nuevaUnidadNombre.toUpperCase(),
          provincia_id: formData.provincia_id ? parseInt(formData.provincia_id) : null,
          sector_id: formData.sector_id ? parseInt(formData.sector_id) : null,
          estado: 'configuracion'
        }])
        .select()
        .single();

      if (unityError) throw unityError;

      // Actualizar lista local y seleccionar la nueva unidad
      setUnidadesExistentes([...unidadesExistentes, data]);
      setFormData({ ...formData, unidad_id: data.id.toString() });
      
      // Cerrar modal y limpiar
      setNuevaUnidadNombre('');
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Error al crear unidad: ' + err.message);
    } finally {
      setAddingUnit(false);
    }
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!formData.unidad_id) throw new Error('Debes seleccionar una unidad electoral.');
      
      // Simulación de navegación al siguiente paso (Paso 2: Configuración específica por órgano)
      setSuccess(true);
      setTimeout(() => {
        // Aquí iría la redirección según el tipo de órgano
        // router.push(`/admin/nacional/configurar-elecciones/paso-2?unidad=${formData.unidad_id}`);
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
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-900/10 blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/admin/nacional/dashboard"
            className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-semibold uppercase tracking-widest text-sm">Volver al Panel</span>
          </Link>
          
          <div className="text-right">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              CONFIGURAR ELECCIONES
            </h1>
            <p className="text-white/40 text-sm mt-1">Paso 1: Par&aacute;metros generales</p>
          </div>
        </div>

        {/* Formulario Principal */}
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
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white cursor-pointer hover:bg-white/10"
                  required
                >
                  <option value="" disabled>Selecciona Provincia</option>
                  {provincias.map(p => <option key={p.id} value={p.id} className="bg-gray-900">{p.nombre}</option>)}
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
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white cursor-pointer hover:bg-white/10"
                  required
                >
                  <option value="" disabled>Selecciona Sector</option>
                  {sectores.map(s => <option key={s.id} value={s.id} className="bg-gray-900">{s.nombre}</option>)}
                </select>
              </div>

              {/* Unidad Electoral */}
              <div className="space-y-3 md:col-span-2">
                <div className="flex justify-between items-center px-1">
                  <label className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-widest">
                    <Building2 className="w-4 h-4" /> Unidad Electoral
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-400/10 px-3 py-1.5 rounded-full border border-blue-400/20"
                  >
                    Dar de alta nueva +
                  </button>
                </div>
                <select
                  value={formData.unidad_id}
                  onChange={(e) => setFormData({ ...formData, unidad_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white cursor-pointer hover:bg-white/10"
                  required
                >
                  <option value="" disabled>Selecciona Unidad</option>
                  {unidadesExistentes
                    .filter(u => (!formData.provincia_id || u.provincia_id === parseInt(formData.provincia_id)))
                    .map(u => <option key={u.id} value={u.id} className="bg-gray-900">{u.nombre}</option>)}
                </select>
              </div>

              {/* Tipo de Órgano */}
              <div className="space-y-3 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-widest px-1">
                  <Users className="w-4 h-4" /> Tipo de &Oacute;rgano
                </label>
                <select
                  value={formData.tipo_organo_id}
                  onChange={(e) => setFormData({ ...formData, tipo_organo_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white cursor-pointer hover:bg-white/10"
                  required
                >
                  <option value="" disabled>Selecciona &Oacute;rgano</option>
                  {organos.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.nombre}</option>)}
                </select>
              </div>
            </div>

            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-sm">{error}</div>}
            
            <button
              type="submit"
              disabled={saving}
              className="w-full py-5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xl rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
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
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-400" /> Nueva Unidad Electoral
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Nombre de la unidad electoral</label>
                  <input
                    type="text"
                    value={nuevaUnidadNombre}
                    onChange={(e) => setNuevaUnidadNombre(e.target.value.toUpperCase())}
                    placeholder="EJ: JUNTA DE PERSONAL SANIDAD SEGOVIA"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500 transition-all text-white placeholder:text-white/20"
                  />
                </div>

                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                  <p className="text-xs text-blue-300 leading-relaxed italic">
                    * Al grabar, esta unidad estar&aacute; disponible para todos los administradores del sistema.
                  </p>
                </div>
              </div>

              <button
                onClick={handleAddUnit}
                disabled={addingUnit || !nuevaUnidadNombre.trim()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {addingUnit ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Database className="w-5 h-5" /> Grabar Unidad</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="relative z-10 mt-12 text-center text-white/20 text-xs">
        CSIF · Sistema de Gesti&oacute;n Electoral · Administrador Nacional
      </footer>
    </div>
  );
}
