"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldAlert, LogOut, Loader2, UserPlus, Trash2, KeyRound } from 'lucide-react';

const supabase = createClient();

export default function RootDashboard() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [nacionales, setNacionales] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Form
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.user_metadata?.role !== 'propietario_sistema') {
        router.replace('/root');
      } else {
        setCheckingAuth(false);
        fetchNacionales();
      }
    };
    checkSession();
  }, [router]);

  const fetchNacionales = async () => {
    setLoadingList(true);
    try {
       const res = await fetch('/api/root/nacionales');
       const data = await res.json();
       if (data.users) setNacionales(data.users);
    } catch(e) {
       console.error("Error cargando nacionales");
    } finally {
       setLoadingList(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      setCreating(true);
      setMsg('');
      try {
          const res = await fetch('/api/root/nacionales', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password, nombre })
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error);
          
          setMsg('Administrador Nacional creado con éxito.');
          setEmail(''); setNombre(''); setPassword('');
          fetchNacionales();
      } catch (err: any) {
          setMsg(`Error: ${err.message}`);
      } finally {
          setCreating(false);
      }
  };

  const handleDelete = async (id: string, currentEmail: string) => {
      if (!confirm(`¿Estás seguro de ELIMINAR permanentemente a ${currentEmail}?`)) return;
      try {
          const res = await fetch(`/api/root/nacionales?id=${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('No se pudo eliminar');
          setMsg('Usuario eliminado correctamente.');
          fetchNacionales();
      } catch(err: any) {
          setMsg(`Error: ${err.message}`);
      }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  if (checkingAuth) {
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center"><Loader2 className="w-10 h-10 text-red-500 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <header className="px-8 py-5 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center">
         <div className="flex items-center gap-3">
             <ShieldAlert className="w-8 h-8 text-red-500" />
             <div>
                 <h1 className="text-xl font-black text-white tracking-widest">SISTEMA <span className="text-red-500">ROOT</span></h1>
                 <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Gestión Crítica de Identidades</p>
             </div>
         </div>
         <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-semibold transition-colors text-sm">
             <LogOut className="w-4 h-4" /> Desconexión
         </button>
      </header>

      <main className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Alta Form */}
          <div className="lg:col-span-1">
             <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
                 <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-neutral-800 pb-4 mb-6">
                     <UserPlus className="w-4 h-4 text-red-400" /> Alta Admin. Nacional
                 </h2>
                 {msg && <div className="mb-4 p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 text-sm font-medium">{msg}</div>}
                 
                 <form onSubmit={handleCreate} className="space-y-4">
                     <div>
                         <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1">Nombre Completo</label>
                         <input type="text" value={nombre} onChange={e=>setNombre(e.target.value)} required className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 rounded-xl focus:border-red-500 outline-none transition-colors" />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1">Email de Acceso</label>
                         <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 rounded-xl focus:border-red-500 outline-none transition-colors" />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1">Contraseña</label>
                         <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 rounded-xl focus:border-red-500 outline-none transition-colors font-mono" />
                     </div>
                     <button type="submit" disabled={creating} className="w-full py-4 mt-2 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                         {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                         Otorgar Acceso
                     </button>
                 </form>
             </div>
          </div>

          {/* Listado */}
          <div className="lg:col-span-2">
             <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl min-h-[500px]">
                 <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-neutral-800 pb-4 mb-6">
                     <ShieldAlert className="w-4 h-4 text-red-400" /> Nacionales Activos
                 </h2>
                 {loadingList ? (
                     <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-neutral-600 animate-spin" /></div>
                 ) : (
                     <div className="space-y-3">
                         {nacionales.map(u => (
                             <div key={u.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded-2xl">
                                 <div>
                                     <h3 className="font-bold text-white">{u.user_metadata?.name || 'Administrador Nacional'}</h3>
                                     <p className="text-sm text-neutral-500">{u.email}</p>
                                 </div>
                                 <button onClick={() => handleDelete(u.id, u.email)} className="mt-3 sm:mt-0 px-4 py-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 rounded-lg flex items-center gap-2 text-xs font-bold uppercase transition-colors">
                                     <Trash2 className="w-4 h-4" /> Revocar
                                 </button>
                             </div>
                         ))}
                         {nacionales.length === 0 && <p className="text-neutral-500 italic text-center py-10">No hay administradores nacionales registrados.</p>}
                     </div>
                 )}
             </div>
          </div>
      </main>
    </div>
  );
}
