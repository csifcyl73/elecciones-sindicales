"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Trash2, 
  Loader2,
  X,
  UserPlus,
  ShieldAlert,
  ChevronRight,
  Database
} from 'lucide-react';

export default function AltaInterventorPage() {
  const [interventores, setInterventores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    enviarEmail: true
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadInterventores();
  }, []);

  const loadInterventores = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/interventores');
      const data = await response.json();
      if (Array.isArray(data)) setInterventores(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAlta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/admin/interventores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      // 2. Si el checkbox está marcado, enviar el email
      if (formData.enviarEmail) {
        await fetch('/api/admin/enviar-credenciales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             email: formData.email,
             nombre: formData.nombre,
             password: formData.password,
             pin: 'PENDIENTE' // El PIN se asigna después en el Paso 3
          }),
        });
      }

      // Reset y recargar
      setFormData({ nombre: '', email: '', password: '', telefono: '', enviarEmail: true });
      setIsModalOpen(false);
      loadInterventores();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteInterventor = async (id: string, email: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${email.toUpperCase()}?`)) return;
    try {
      const response = await fetch(`/api/admin/interventores?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setInterventores(interventores.filter(u => u.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = interventores.filter(u => 
    u.user_metadata?.nombre?.toUpperCase().includes(searchTerm.toUpperCase()) || 
    u.email.toUpperCase().includes(searchTerm.toUpperCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[120px]" />
        <div className="absolute bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
          <div>
            <Link href="/admin/nacional/dashboard" className="group flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-4">
              <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-semibold uppercase tracking-widest text-[11px]">DASHBOARD NACIONAL</span>
            </Link>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-blue-400 uppercase leading-none">
              GESTI&Oacute;N DE <br /> INTERVENTORES
            </h1>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black py-5 px-10 rounded-[30px] shadow-[0_10px_40px_rgba(37,99,235,0.3)] transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-sm"
          >
            <UserPlus className="w-6 h-6" /> Dar de alta nuevo
          </button>
        </div>

        {/* Buscador y Stats */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input 
                type="text" 
                placeholder="BUSCAR POR NOMBRE O EMAIL DEL INTERVENTOR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[24px] pl-16 pr-8 py-5 focus:outline-none focus:border-blue-500 transition-all text-white font-bold placeholder:text-white/20 uppercase"
              />
            </div>
            <div className="md:col-span-4 bg-white/5 border border-white/10 rounded-[24px] px-8 py-5 flex items-center justify-between">
              <span className="text-white/40 font-bold uppercase tracking-widest text-xs leading-none">Total registros</span>
              <span className="text-3xl font-black text-blue-400 leading-none">{interventores.length}</span>
            </div>
        </div>

        {/* Listado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-[32px] h-48 animate-pulse" />
            ))
          ) : filtered.length > 0 ? (
            filtered.map((u) => (
              <div key={u.id} className="group bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[35px] hover:bg-white/10 transition-all duration-300 relative overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10">
                <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                   <div className="flex items-start justify-between">
                      <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                         <ShieldCheck className="w-6 h-6 text-blue-400" />
                      </div>
                      <button 
                        onClick={() => deleteInterventor(u.id, u.email)}
                        className="p-2 rounded-xl text-white/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                         <Trash2 className="w-5 h-5" />
                      </button>
                   </div>

                   <div>
                      <h3 className="font-black text-xl text-white uppercase tracking-tight truncate leading-tight">
                        {u.user_metadata?.nombre || 'SIN NOMBRE'}
                      </h3>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">SISTEMA ELECTORAL CSIF</p>
                   </div>

                   <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-3 text-white/60">
                         <Mail className="w-4 h-4 text-blue-400/60" />
                         <span className="text-xs font-medium truncate">{u.email}</span>
                      </div>
                      {u.user_metadata?.telefono && (
                        <div className="flex items-center gap-3 text-white/60">
                           <Phone className="w-4 h-4 text-blue-400/60" />
                           <span className="text-xs font-medium">{u.user_metadata.telefono}</span>
                        </div>
                      )}
                   </div>
                </div>

                {/* Card Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] group-hover:bg-blue-500/10 transition-all" />
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center gap-4 text-white/20">
               <ShieldAlert className="w-16 h-16" />
               <p className="font-black uppercase tracking-widest">No se han encontrado interventores</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ALTA NUEVO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-[#111827] border border-white/10 w-full max-w-xl rounded-[45px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)] relative">
              
              <div className="p-10 space-y-8">
                 <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase flex items-center gap-3">
                        <UserPlus className="text-blue-400" /> Nuevo Interventor
                      </h2>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">RELLENA LOS DATOS DE ACCESO</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                 </div>

                 {errorMsg && (
                    <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                       {errorMsg}
                    </div>
                 )}

                 <form onSubmit={handleAlta} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-white/40 uppercase tracking-widest px-2">Nombre completo</label>
                       <input 
                         required
                         type="text" 
                         value={formData.nombre}
                         onChange={(e) => setFormData({...formData, nombre: e.target.value.toUpperCase()})}
                         placeholder="P. EJ: MAR&Iacute;A GARC&Iacute;A L&Oacute;PEZ"
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-blue-500 transition-all text-white font-bold placeholder:text-white/10"
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-white/40 uppercase tracking-widest px-2">Email corporativo</label>
                        <input 
                          required
                          type="email" 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="admin@csif.es"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-blue-500 transition-all text-white font-bold placeholder:text-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-white/40 uppercase tracking-widest px-2">Contraseña acceso</label>
                        <input 
                          required
                          type="password" 
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-blue-500 transition-all text-white font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-white/40 uppercase tracking-widest px-2">Tel&eacute;fono de contacto (Opcional)</label>
                       <input 
                         type="text" 
                         value={formData.telefono}
                         onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                         placeholder="600 000 000"
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-blue-500 transition-all text-white font-bold placeholder:text-white/10"
                       />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                       <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={formData.enviarEmail}
                            onChange={(e) => setFormData({...formData, enviarEmail: e.target.checked})}
                            className="w-5 h-5 rounded-lg border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/20 transition-all cursor-pointer"
                          />
                          <span className="text-[12px] font-black text-white/60 uppercase tracking-widest group-hover:text-blue-400 transition-colors">Enviar credenciales automáticas por email</span>
                       </label>
                    </div>

                    <button 
                      disabled={saving}
                      className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-xl rounded-3xl transition-all shadow-xl disabled:opacity-50 uppercase tracking-widest mt-4"
                    >
                      {saving ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : "Grabar interventor"}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
