"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Trash2, 
  UserRoundCog,
  Loader2, 
  X, 
  Database,
  Search,
  Mail,
  MapPin,
  CheckCircle2
} from 'lucide-react';

const COMUNIDADES = [
  'ANDALUCÍA', 'ARAGÓN', 'ASTURIAS (PRINCIPADO DE)', 'BALEARES (ISLAS)', 'CANARIAS',
  'CANTABRIA', 'CASTILLA-LA MANCHA', 'CASTILLA Y LEÓN', 'CATALUÑA', 'COMUNIDAD VALENCIANA',
  'EXTREMADURA', 'GALICIA', 'LA RIOJA', 'MADRID (COMUNIDAD DE)', 'MURCIA (REGIÓN DE)',
  'NAVARRA (COMUNIDAD FORAL DE)', 'PAÍS VASCO', 'CEUTA (CIUDAD AUTÓNOMA DE)', 'MELILLA (CIUDAD AUTÓNOMA DE)'
];

export default function GestionAdminsAutonomicosPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados Modal Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editApellidos, setEditApellidos] = useState('');
  const [editComunidad, setEditComunidad] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/administradores');
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (admin: any) => {
    setSelectedAdmin(admin);
    setEditNombre(admin.user_metadata?.nombre || '');
    setEditApellidos(admin.user_metadata?.apellidos || '');
    setEditComunidad(admin.user_metadata?.comunidad || '');
    setEditEmail(admin.email || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { 
        id: selectedAdmin.id, 
        nombre: editNombre.toUpperCase(), 
        apellidos: editApellidos.toUpperCase(),
        comunidad: editComunidad.toUpperCase(),
        email: editEmail
      };
      
      if (editPassword.trim() !== '') {
        payload.password = editPassword;
      }

      const response = await fetch('/api/admin/administradores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al actualizar');
      }
      
      const updatedUser = await response.json();
      setAdmins(admins.map(a => a.id === updatedUser.id ? updatedUser : a));
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de borrar este administrador permanentemente? Perderá el acceso de forma inmediata.')) return;
    try {
      const res = await fetch(`/api/admin/administradores?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al borrar');
      setAdmins(admins.filter(a => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = admins.filter(a => {
    const meta = a.user_metadata || {};
    const fullText = `${meta.nombre} ${meta.apellidos} ${a.email} ${meta.comunidad}`.toLowerCase();
    return fullText.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c]">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-emerald-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex flex-col gap-4">
            <Link href="/admin/nacional/alta-autonomico" className="group flex items-center gap-2 text-white/40 hover:text-white transition-colors w-fit">
              <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="font-bold uppercase tracking-widest text-[10px]">Panel Nacional</span>
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
                <UserRoundCog className="w-9 h-9 text-blue-400" /> LISTADO DE ADMINISTRADORES
              </h1>
              <p className="text-white/40 text-[10px] mt-1 uppercase font-bold tracking-[3px]">GESTI&Oacute;N INTEGRAL DE RESPONSABLES AUTON&Oacute;MICOS</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="BUSCAR POR NOMBRE O COMUNIDAD..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500 transition-all text-white font-bold placeholder:text-white/20 uppercase"
            />
          </div>
        </div>

        {/* Listado */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                  <th className="px-8 py-6">ADMINISTRADOR</th>
                  <th className="px-8 py-6">EMAIL DE ACCESO</th>
                  <th className="px-8 py-6">COMUNIDAD AUT&Oacute;NOMA</th>
                  <th className="px-8 py-6 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((a) => (
                  <tr 
                    key={a.id} 
                    className="group hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => handleEditClick(a)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-white group-hover:text-blue-400 transition-colors uppercase">
                          {a.user_metadata?.nombre} {a.user_metadata?.apellidos}
                        </span>
                        <span className="text-[10px] text-white/30 font-bold">REGISTRADO: {new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-white/60 font-medium text-sm">
                        <Mail className="w-3 h-3" />
                        {a.email}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 font-black text-[10px] tracking-widest">
                          {a.user_metadata?.comunidad}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                        className="p-3 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        title="Borrar administrador"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-white/20 italic font-bold uppercase tracking-widest text-xs">
                      NO SE HAN ENCONTRADO ADMINISTRADORES
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="mt-12 text-center text-white/20 text-[10px] font-bold uppercase tracking-widest">
          CSIF · GESTI&Oacute;N DE USUARIOS · ADMINISTRADOR NACIONAL
        </footer>
      </div>

      {/* MODAL EDICIÓN */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-white/10 w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                  <UserRoundCog className="w-6 h-6 text-blue-400" /> Editar Responsable
                </h2>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-all"><X className="w-6 h-6" /></button>
              </div>
              
              <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Nombre</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 focus:outline-none focus:border-blue-500 transition-all text-white font-bold uppercase placeholder:text-white/10"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Apellidos</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 focus:outline-none focus:border-blue-500 transition-all text-white font-bold uppercase placeholder:text-white/10"
                    value={editApellidos}
                    onChange={(e) => setEditApellidos(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Email de acceso</label>
                  <input
                    type="email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 focus:outline-none focus:border-blue-500 transition-all text-white font-bold lowercase placeholder:text-white/10"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Comunidad Autónoma</label>
                  <select
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-5 py-3 focus:outline-none focus:border-blue-500 transition-all text-white font-bold appearance-none cursor-pointer"
                    value={editComunidad}
                    onChange={(e) => setEditComunidad(e.target.value)}
                    required
                  >
                    {COMUNIDADES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mt-2">
                   <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-1">Resetear Contraseña (Opcional)</label>
                   <p className="text-white/40 text-[10px] mb-2 px-1">Deja este campo vacío si no deseas modificar la contraseña actual.</p>
                   <input
                     type="text"
                     placeholder="Nueva contraseña (mín. 8 caracteres)"
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 focus:outline-none focus:border-blue-500 transition-all text-white font-bold placeholder:text-white/20"
                     value={editPassword}
                     onChange={(e) => setEditPassword(e.target.value)}
                     minLength={8}
                   />
                </div>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="md:col-span-2 mt-4 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Guardar Cambios</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
