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
  Building2,
  UploadCloud,
  DownloadCloud,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function GestionSindicatosPage() {
  const [sindicatos, setSindicatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados Modal Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSindicato, setSelectedSindicato] = useState<any>(null);
  const [editSiglas, setEditSiglas] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editEsFederacion, setEditEsFederacion] = useState(false);
  const [editFederacionId, setEditFederacionId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Estados Modal Añadir
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSiglas, setNewSiglas] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newEsFederacion, setNewEsFederacion] = useState(false);
  const [newFederacionId, setNewFederacionId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  // Estado inline "Nueva Federación" (compartido por ambos modales)
  const [showNewFedForm, setShowNewFedForm] = useState<'edit' | 'add' | null>(null);
  const [newFedSiglas, setNewFedSiglas] = useState('');
  const [newFedNombre, setNewFedNombre] = useState('');
  const [savingNewFed, setSavingNewFed] = useState(false);

  // Estados Importación
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    setEditEsFederacion(s.es_federacion || false);
    setEditFederacionId(s.federacion_id || null);
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
          nombre_completo: editNombre.toUpperCase(),
          es_federacion: editEsFederacion,
          federacion_id: editFederacionId
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
          nombre_completo: newNombre.toUpperCase(),
          es_federacion: newEsFederacion,
          federacion_id: newFederacionId
        }),
      });
      if (!response.ok) throw new Error('Error al añadir');
      
      const created = await response.json();
      setSindicatos([...sindicatos, created]);
      setIsAddModalOpen(false);
      setNewSiglas('');
      setNewNombre('');
      setNewFederacionId(null);
      setNewEsFederacion(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  // Crear federación al vuelo y asignarla al modal activo
  const handleCreateFederacionInline = async (context: 'edit' | 'add') => {
    if (!newFedSiglas.trim() || !newFedNombre.trim()) return;
    setSavingNewFed(true);
    try {
      const response = await fetch('/api/admin/sindicatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siglas: newFedSiglas.toUpperCase(),
          nombre_completo: newFedNombre.toUpperCase(),
          es_federacion: true,
          federacion_id: null
        }),
      });
      if (!response.ok) throw new Error('Error al crear federación');
      const created = await response.json();
      // Añadir a la lista local
      setSindicatos(prev => [...prev, created]);
      // Asignar al modal activo
      if (context === 'edit') setEditFederacionId(created.id);
      else setNewFederacionId(created.id);
      // Limpiar form inline
      setNewFedSiglas('');
      setNewFedNombre('');
      setShowNewFedForm(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingNewFed(false);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ 'Siglas': '', 'Nombre_completo': '' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sindicatos");
    XLSX.writeFile(wb, "Plantilla_Sindicatos.xlsx");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        const payload = json.map((row) => ({
          siglas: (row['Siglas'] || row['SIGLAS'] || '').toString().trim().toUpperCase(),
          nombre_completo: (row['Nombre_completo'] || row['NOMBRE_COMPLETO'] || row['Nombre completo'] || '').toString().trim().toUpperCase()
        })).filter(s => s.siglas && s.nombre_completo);

        if (payload.length === 0) {
          alert('El archivo no contiene filas válidas (recuerda que Siglas y Nombre_completo son obligatorios o tal vez las columnas no se llaman así).');
          return;
        }

        const res = await fetch('/api/admin/sindicatos/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error || 'Error importando sindicatos');

        alert(`Importación completada:\n- ${result.imported} Importados\n- ${result.duplicated} Omitidos (Duplicados)`);
        loadSindicatos();
        
      } catch (err: any) {
        alert('Hubo un error importando el archivo: ' + err.message);
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      alert("Error leyendo el archivo");
      setImporting(false);
    };

    reader.readAsBinaryString(file);
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

  const federaciones = sindicatos.filter(s => s.es_federacion && (!selectedSindicato || s.id !== selectedSindicato.id));

  const filtered = (sindicatos || []).filter(s => 
    (s.siglas?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (s.nombre_completo?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
      {/* Tooltip simple custom */}
      <style jsx global>{`
        .tooltip-container { position: relative; display: inline-block; }
        .tooltip-text {
          visibility: hidden;
          width: 250px;
          background-color: #1f2937;
          color: #fff;
          text-align: center;
          border-radius: 8px;
          padding: 8px;
          position: absolute;
          z-index: 100;
          bottom: 125%;
          left: 50%;
          margin-left: -125px;
          opacity: 0;
          transition: opacity 0.3s;
          font-size: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          pointer-events: none;
        }
        .tooltip-container:hover .tooltip-text { visibility: visible; opacity: 1; }
      `}</style>
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-orange-900/10 blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-amber-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex flex-col gap-4">
            <Link href="/admin/nacional/dashboard" className="group flex items-center gap-2 text-white/40 hover:text-white transition-colors w-fit">
              <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="font-bold uppercase tracking-widest text-[10px]">Panel Nacional</span>
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
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            <button 
              onClick={handleDownloadTemplate}
              className="w-full sm:w-auto px-4 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] shrink-0 border border-white/10"
              title="Descargar Plantilla Excel"
            >
              <DownloadCloud className="w-4 h-4" /> Plantilla
            </button>
            <button 
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-4 py-4 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] shrink-0 border border-blue-500/20 disabled:opacity-50"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {importing ? 'Importando...' : 'Importar'}
            </button>
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
                  <th className="px-8 py-6">NOMBRE COMPLETO / FEDERACIÓN</th>
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
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="font-bold text-white/80 group-hover:text-white transition-colors uppercase text-sm">
                          {s.nombre_completo.toUpperCase()}
                        </div>
                        {s.federacion_id && (
                          <div className="text-[10px] text-white/30 font-bold flex items-center gap-1 uppercase">
                            <Building2 className="w-3 h-3" /> FEDERACIÓN: {sindicatos.find(f => f.id === s.federacion_id)?.siglas || 'N/A'}
                          </div>
                        )}
                        {s.es_federacion && (
                          <div className="text-[10px] text-emerald-400/50 font-black uppercase tracking-tighter">
                            [ FEDERACIÓN / CONFEDERACIÓN ]
                          </div>
                        )}
                      </div>
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
          CSIF · GESTI&Oacute;N GLOBAL DE SINDICATOS · ADMINISTRADOR NACIONAL
        </footer>
      </div>

      {/* MODAL EDICIÓN */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
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
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all cursor-pointer" onClick={() => setEditEsFederacion(!editEsFederacion)}>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-white uppercase tracking-tight">¿Es una Federación / Asociación?</span>
                          <span className="text-[9px] text-white/40 uppercase font-black tracking-widest leading-none mt-1">Marca esta opción si es una entidad paraguas</span>
                       </div>
                       <div className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${editEsFederacion ? 'bg-orange-500' : 'bg-white/10'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${editEsFederacion ? 'translate-x-4' : 'translate-x-0'}`} />
                       </div>
                    </div>
                  </div>

                  {!editEsFederacion && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Federación / Asociación Vinculada</label>
                        <div className="tooltip-container">
                          <Info className="w-3 h-3 text-white/20 hover:text-white transition-colors" />
                          <span className="tooltip-text">Asociar el sindicato a una federación, confederación, intersindical o asociación de sindicatos</span>
                        </div>
                      </div>
                      <div className="flex gap-2 items-stretch w-full">
                        <select
                          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 transition-all text-white font-bold uppercase appearance-none"
                          value={editFederacionId || ''}
                          onChange={(e) => setEditFederacionId(e.target.value ? parseInt(e.target.value) : null)}
                        >
                          <option value="" className="bg-[#111827]">INDIVIDUAL (SIN FEDERACIÓN)</option>
                          {federaciones.map(f => (
                            <option key={f.id} value={f.id} className="bg-[#111827]">{f.siglas} - {f.nombre_completo}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          title="Dar de alta una nueva federación"
                          onClick={() => setShowNewFedForm(showNewFedForm === 'edit' ? null : 'edit')}
                          className={`px-4 py-3 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-1 shrink-0 ${
                            showNewFedForm === 'edit'
                              ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                              : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/30'
                          }`}
                        >
                          <Plus className="w-3 h-3" /> Nueva
                        </button>
                      </div>
                      {showNewFedForm === 'edit' && (
                        <div className="mt-2 p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          <p className="text-[9px] font-black text-orange-400/70 uppercase tracking-widest">✦ Alta rápida de nueva federación</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="SIGLAS"
                              value={newFedSiglas}
                              onChange={e => setNewFedSiglas(e.target.value)}
                              className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500 text-white font-bold uppercase text-xs"
                            />
                            <input
                              type="text"
                              placeholder="NOMBRE COMPLETO"
                              value={newFedNombre}
                              onChange={e => setNewFedNombre(e.target.value)}
                              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500 text-white font-bold uppercase text-xs"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleCreateFederacionInline('edit')}
                              disabled={savingNewFed || !newFedSiglas.trim() || !newFedNombre.trim()}
                              className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                            >
                              {savingNewFed ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Crear y Vincular
                            </button>
                            <button type="button" onClick={() => { setShowNewFedForm(null); setNewFedSiglas(''); setNewFedNombre(''); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/40 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
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
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white font-bold uppercase"
                      value={newNombre}
                      onChange={(e) => setNewNombre(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all cursor-pointer" onClick={() => setNewEsFederacion(!newEsFederacion)}>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-white uppercase tracking-tight">¿Es una Federación / Asociación?</span>
                          <span className="text-[9px] text-white/40 uppercase font-black tracking-widest leading-none mt-1">Marca esta opción si es una entidad paraguas</span>
                       </div>
                       <div className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${newEsFederacion ? 'bg-emerald-500' : 'bg-white/10'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${newEsFederacion ? 'translate-x-4' : 'translate-x-0'}`} />
                       </div>
                    </div>
                  </div>

                  {!newEsFederacion && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-1 text-white/40">
                         <label className="text-[10px] font-bold uppercase tracking-widest">Federación / Asociación Vinculada</label>
                         <div className="tooltip-container">
                            <Info className="w-3 h-3 text-white/20 hover:text-white transition-colors" />
                            <span className="tooltip-text">Asociar el sindicato a una federación, confederación, intersindical o asociación de sindicatos</span>
                         </div>
                      </div>
                      <div className="flex gap-2 items-stretch w-full">
                        <select
                          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-white font-bold uppercase appearance-none"
                          value={newFederacionId || ''}
                          onChange={(e) => setNewFederacionId(e.target.value ? parseInt(e.target.value) : null)}
                        >
                          <option value="" className="bg-[#111827]">INDIVIDUAL (SIN FEDERACIÓN)</option>
                          {federaciones.map(f => (
                            <option key={f.id} value={f.id} className="bg-[#111827]">{f.siglas} - {f.nombre_completo}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          title="Dar de alta una nueva federación"
                          onClick={() => setShowNewFedForm(showNewFedForm === 'add' ? null : 'add')}
                          className={`px-4 py-3 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-1 shrink-0 ${
                            showNewFedForm === 'add'
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                              : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/30'
                          }`}
                        >
                          <Plus className="w-3 h-3" /> Nueva
                        </button>
                      </div>
                      {showNewFedForm === 'add' && (
                        <div className="mt-2 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          <p className="text-[9px] font-black text-emerald-400/70 uppercase tracking-widest">✦ Alta rápida de nueva federación</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="SIGLAS"
                              value={newFedSiglas}
                              onChange={e => setNewFedSiglas(e.target.value)}
                              className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 text-white font-bold uppercase text-xs"
                            />
                            <input
                              type="text"
                              placeholder="NOMBRE COMPLETO"
                              value={newFedNombre}
                              onChange={e => setNewFedNombre(e.target.value)}
                              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 text-white font-bold uppercase text-xs"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleCreateFederacionInline('add')}
                              disabled={savingNewFed || !newFedSiglas.trim() || !newFedNombre.trim()}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                            >
                              {savingNewFed ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Crear y Vincular
                            </button>
                            <button type="button" onClick={() => { setShowNewFedForm(null); setNewFedSiglas(''); setNewFedNombre(''); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/40 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
