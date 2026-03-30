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
  AlertCircle
} from 'lucide-react';

export default function ConfigurarEleccionesPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Estados para datos maestros
  const [provincias, setProvincias] = useState<any[]>([]);
  const [sectores, setSectores] = useState<any[]>([]);
  const [organos, setOrganos] = useState<any[]>([]);
  const [unidadesExistentes, setUnidadesExistentes] = useState<any[]>([]);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    provincia_id: '',
    sector_id: '',
    unidad_id: '',
    tipo_organo_id: '',
    nombre_nueva_unidad: '',
    delegados: 1
  });
  
  const [showNuevaUnidad, setShowNuevaUnidad] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMasters = async () => {
      setLoading(true);
      
      // 1. Verificar sesión (Desactivado temporalmente para permitir visualización directa)
      /*
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.user_metadata?.role !== 'admin_nacional') {
        router.replace('/admin/nacional');
        return;
      }
      */

      // 2. Cargar Maestros
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

    loadMasters();
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let finalUnidadId = formData.unidad_id;

      // Si es una nueva unidad, primero la creamos
      if (showNuevaUnidad && formData.nombre_nueva_unidad) {
        const { data, error: unityError } = await supabase
          .from('unidades_electorales')
          .insert([{
            nombre: formData.nombre_nueva_unidad.toUpperCase(),
            provincia_id: parseInt(formData.provincia_id),
            sector_id: parseInt(formData.sector_id),
            tipo_organo_id: parseInt(formData.tipo_organo_id),
            delegados_a_elegir: formData.delegados,
            estado: 'configuracion'
          }])
          .select()
          .single();

        if (unityError) throw unityError;
        finalUnidadId = data.id;
      } else if (!finalUnidadId) {
        throw new Error('Debes seleccionar o crear una unidad electoral.');
      }

      // El usuario "configura" la elección (podríamos crear un registro de 'eleccion' vinculado a la unidad)
      // Por ahora, marcamos la unidad como 'activa' o 'configurada'
      const { error: updateError } = await supabase
        .from('unidades_electorales')
        .update({ estado: 'activa' })
        .eq('id', finalUnidadId);

      if (updateError) throw updateError;

      setSuccess(true);
      // Opcional: Redirigir tras éxito
      setTimeout(() => router.push('/admin/nacional/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración.');
    } finally {
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
        {/* Header con botón para volver */}
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
            <p className="text-white/40 text-sm mt-1">Definición de parámetros electorales</p>
          </div>
        </div>

        {/* Card del Formulario */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[32px] shadow-2xl">
          <form onSubmit={handleSave} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Provincia */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-widest px-1">
                  <MapPin className="w-4 h-4" /> Provincia
                </label>
                <select
                  value={formData.provincia_id}
                  onChange={(e) => setFormData({ ...formData, provincia_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white appearance-none cursor-pointer hover:bg-white/10"
                  required
                >
                  <option value="" disabled className="bg-gray-900">Selecciona Provincia</option>
                  {provincias.map(p => (
                    <option key={p.id} value={p.id} className="bg-gray-900">{p.nombre}</option>
                  ))}
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
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white appearance-none cursor-pointer hover:bg-white/10"
                  required
                >
                  <option value="" disabled className="bg-gray-900">Selecciona Sector</option>
                  {sectores.map(s => (
                    <option key={s.id} value={s.id} className="bg-gray-900">{s.nombre}</option>
                  ))}
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
                    onClick={() => setShowNuevaUnidad(!showNuevaUnidad)}
                    className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-400/10 px-3 py-1.5 rounded-full border border-blue-400/20"
                  >
                    {showNuevaUnidad ? 'Seleccionar existente' : 'Dar de alta nueva'}
                    {showNuevaUnidad ? <CheckCircle2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  </button>
                </div>

                {showNuevaUnidad ? (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <input
                      type="text"
                      placeholder="Nombre de la nueva unidad (ej: Ayto. de Madrid - Laborales)"
                      value={formData.nombre_nueva_unidad}
                      onChange={(e) => setFormData({ ...formData, nombre_nueva_unidad: e.target.value })}
                      className="w-full bg-blue-900/10 border border-blue-400/30 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500 transition-all text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                      required
                    />
                  </div>
                ) : (
                  <select
                    value={formData.unidad_id}
                    onChange={(e) => setFormData({ ...formData, unidad_id: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white appearance-none cursor-pointer hover:bg-white/10"
                    required={!showNuevaUnidad}
                  >
                    <option value="" disabled className="bg-gray-900">Selecciona Unidad</option>
                    {unidadesExistentes
                      .filter(u => 
                        (!formData.provincia_id || u.provincia_id === parseInt(formData.provincia_id)) && 
                        (!formData.sector_id || u.sector_id === parseInt(formData.sector_id))
                      )
                      .map(u => (
                        <option key={u.id} value={u.id} className="bg-gray-900">{u.nombre}</option>
                      ))
                    }
                    {unidadesExistentes.length === 0 && <option disabled className="bg-gray-900">No hay unidades cargadas</option>}
                  </select>
                )}
              </div>

              {/* Tipo de Órgano */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-widest px-1">
                  <Users className="w-4 h-4" /> Tipo de &Oacute;rgano
                </label>
                <select
                  value={formData.tipo_organo_id}
                  onChange={(e) => setFormData({ ...formData, tipo_organo_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white appearance-none cursor-pointer hover:bg-white/10"
                  required
                >
                  <option value="" disabled className="bg-gray-900">Selecciona &Oacute;rgano</option>
                  {organos.map(o => (
                    <option key={o.id} value={o.id} className="bg-gray-900">{o.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Delegados a elegir (extra if new unity) */}
              {showNuevaUnidad && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                  <label className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-widest px-1">
                    Delegados a elegir
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.delegados}
                    onChange={(e) => setFormData({ ...formData, delegados: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white"
                  />
                </div>
              )}

            </div>

            {/* Feedback Mensajes */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-sm font-semibold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-sm font-semibold animate-bounce">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                Configuraci&oacute;n guardada con &eacute;xito. Redirigiendo...
              </div>
            )}

            {/* Botón de Guardar */}
            <button
              type="submit"
              disabled={saving || success}
              className="w-full py-5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xl rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" /> Guardar Configuraci&oacute;n
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <footer className="relative z-10 mt-12 text-center text-white/20 text-xs">
        CSIF · Sistema de Gesti&oacute;n Electoral · Administrador Nacional
      </footer>
    </div>
  );
}
