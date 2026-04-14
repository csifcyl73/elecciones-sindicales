"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Loader2, 
  X, 
  Settings2,
  Database,
  Search,
  Building2
} from 'lucide-react';

export default function GestionSindicatosPage() {
  const [sindicatos, setSindicatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados Modal Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSindicato, setSelectedSindicato] = useState<any>(null);
  const [editSiglas, setEditSiglas] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [saving, setSaving] = useState(false);

  // Estados Modal Añadir
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSiglas, setNewSiglas] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadSindicatos();
  }, []);

  const loadSindicatos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sindicatos');
      const data = await res.json();
      setSindicatos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (s: any) => {
    setSelectedSindicato(s);
    setEditSiglas(s.siglas);
    setEditNombre(s.nombre_completo);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSiglas.trim() || !editNombre.trim()) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/sindicatos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: selectedSindicato.id, 
          siglas: editSiglas.toUpperCase(), 
          nombre_completo: editNombre.toUpperCase() 
        }),
      });
      if (!response.ok) throw new Error('Error al actualizar');
      
      const updated = await response.json();
      setSindicatos(sindicatos.map(s => s.id === updated.id ? updated : s));
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiglas.trim() || !newNombre.trim()) return;
    setAdding(true);
    try {
      const response = await fetch('/api/admin/sindicatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          siglas: newSiglas.toUpperCase(), 
          nombre_completo: newNombre.toUpperCase() 
        }),
      });
      if (!response.ok) throw new Error('Error al añadir');
      
      const created = await response.json();
      setSindicatos([...sindicatos, created]);
      setIsAddModalOpen(false);
      setNewSiglas('');
      setNewNombre('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de borrar este sindicato? Esto lo eliminará permanentemente de todos los listados.')) return;
    try {
      const res = await fetch(`/api/admin/sindicatos?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al borrar');
      setSindicatos(sindicatos.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = sindicatos.filter(s => 
    s.siglas.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c]">
        <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-orange-900/10 blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-amber-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex flex-col gap-4">
            <Link href="/admin/autonomico/dashboard" className="group flex items-center gap-2 text-white/40 hover:text-white transition-colors w-fit">
              <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="font-bold uppercase tracking-widest text-[10px]">Panel Autonómico</span>
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
                <Settings2 className="w-8 h-8 text-orange-400" /> GESTI&Oacute;N DE SINDICATOS
              </h1>
              <p className="text-white/40 text-xs mt-1 uppercase font-bold tracking-[3px]">ADMINISTRACI&Oacute;N GLOBAL DE ORGANIZACIONES</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input 
                type="text" 
                placeholder="BUSCAR SINDICATO..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-orange-500 transition-all text-white font-bold placeholder:text-white/20 uppercase"
              />
            </div>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-full sm:w-auto px-6 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest text-sm shrink-0"
            >
              <Plus className="w-5 h-5" /> Añadir Nuevo
            </button>
          </div>
        </div>

        {/* Listado */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                  <th className="px-8 py-6">SIGLAS</th>
                  <th className="px-8 py-6">NOMBRE COMPLETO</th>
                  <th className="px-8 py-6 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((s) => (
                  <tr 
                    key={s.id} 
                    className="group hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => handleEditClick(s)}
                  >
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 font-black text-xs">
                        {s.siglas.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-bold text-white/80 group-hover:text-white transition-colors uppercase text-sm">
                      {s.nombre_completo.toUpperCase()}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                        className="p-3 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        title="Borrar registro"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-8 py-12 text-center text-white/20 italic font-bold uppercase tracking-widest text-xs">
                      NO SE HAN ENCONTRADO ORGANIZACIONES SINDICALES
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="mt-12 text-center text-white/20 text-[10px] font-bold uppercase tracking-widest">
          CSIF · GESTI&Oacute;N GLOBAL DE SINDICATOS · ADMINISTRADOR AUTON&Oacute;MICO
        </footer>
      </div>

      {/* MODAL EDICIÓN */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-white/10 w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                  <Database className="w-5 h-5 text-orange-400" /> Editar Organización
                </h2>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-all"><X className="w-6 h-6" /></button>
              </div>
              
              <form onSubmit={handleSaveEdit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Siglas del sindicato</label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 transition-all text-white font-bold uppercase"
                      value={editSiglas}
                      onChange={(e) => setEditSiglas(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Nombre completo del sindicato</label>
                    <textarea
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 transition-all text-white font-bold uppercase resize-none"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-orange-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Guardar Cambios</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* MODAL AÑADIR */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-white/10 w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                  <Database className="w-5 h-5 text-emerald-400" /> Añadir Sindicato
                </h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-all"><X className="w-6 h-6" /></button>
              </div>
              
              <form onSubmit={handleAddNew} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Siglas del nuevo sindicato</label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white font-bold uppercase"
                      value={newSiglas}
                      onChange={(e) => setNewSiglas(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Nombre completo</label>
                    <textarea
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white font-bold uppercase resize-none"
                      value={newNombre}
                      onChange={(e) => setNewNombre(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={adding}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest"
                >
                  {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Confirmar Creación</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
