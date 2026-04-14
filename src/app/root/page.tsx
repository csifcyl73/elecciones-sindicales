"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Loader2, Key } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const supabase = createClient();

export default function RootLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || user?.user_metadata?.role !== 'propietario_sistema') {
      setError('Credenciales de acceso maestro denegadas.');
      if (!error) await supabase.auth.signOut();
      setLoading(false);
    } else {
      router.push('/root/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-950 flex-col items-center justify-center relative overflow-hidden">
      <Link
        href="/"
        className="absolute top-8 left-8 z-50 flex items-center gap-2 text-neutral-400 font-semibold hover:text-white transition-colors bg-neutral-900/80 p-3 rounded-xl shadow-sm backdrop-blur-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        INICIO
      </Link>

      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 bg-neutral-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-neutral-800 flex flex-col items-center">
        <div className="mb-6 p-4 rounded-full bg-red-500/10 border border-red-500/30">
            <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-wide text-center">
          ACCESO RAÍZ
        </h1>
        <p className="text-neutral-400 text-sm mb-8 text-center font-medium">Panel de control de Superadministradores</p>

        <form className="w-full space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Token Identifier (Email)</label>
            <input
              type="email"
              placeholder="root@csif.es"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 mt-2 text-lg text-white bg-neutral-950 border-2 border-neutral-800 rounded-2xl focus:outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 transition-all font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Master Key</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 mt-2 text-lg text-white bg-neutral-950 border-2 border-neutral-800 rounded-2xl focus:outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 transition-all font-mono tracking-widest"
              required
            />
          </div>

          {error && (
            <div className="w-full p-4 bg-red-950/50 border border-red-900 rounded-xl text-red-400 text-sm font-semibold text-center mt-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-4 px-6 text-lg font-black text-white bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Key className="w-5 h-5" />}
            {loading ? 'Verificando...' : 'DESBLOQUEAR SISTEMA'}
          </button>
        </form>
      </div>
    </div>
  );
}
