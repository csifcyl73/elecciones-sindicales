"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Inbox, FileText, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const supabase = createClient();

export default function AdminAutonomicoLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Usuario o contraseña incorrectos. Inténtalo de nuevo.');
      setLoading(false);
      return;
    }

    // Verificar que el usuario tiene el rol correcto
    const role = data.user?.user_metadata?.role;
    if (role !== 'super_autonomico') {
      await supabase.auth.signOut();
      setError('Acceso denegado. Esta área es exclusiva para administradores autonómicos.');
      setLoading(false);
      return;
    }

    router.push('/admin/autonomico/dashboard');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col items-center justify-center relative overflow-hidden">
      {/* Botón para volver al inicio */}
      <Link
        href="/"
        className="absolute top-8 left-8 z-50 flex items-center gap-2 text-[#008c45] font-semibold hover:text-[#004d26] transition-colors bg-white/80 p-3 rounded-full shadow-sm backdrop-blur-sm hover:scale-105"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver
      </Link>

      {/* Marcas de agua de fondo */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <Mail className="absolute text-[#008c45] opacity-[0.03] w-96 h-96 -top-20 -left-20 animate-[spin_60s_linear_infinite]" />
        <Inbox className="absolute text-[#008c45] opacity-[0.04] w-[500px] h-[500px] top-1/2 -right-40 -translate-y-1/2 animate-[pulse_10s_ease-in-out_infinite]" />
        <FileText className="absolute text-green-900 opacity-[0.03] w-80 h-80 -bottom-20 left-1/4 animate-[bounce_8s_infinite]" />
        <Users className="absolute text-[#008c45] opacity-[0.03] w-72 h-72 top-20 right-1/4 animate-[spin_40s_linear_infinite_reverse]" />
      </div>

      {/* Badge de tipo de acceso */}
      <div className="relative z-10 mb-6">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Administrador Autonómico
        </span>
      </div>

      {/* Contenedor central (Login) */}
      <div className="relative z-10 w-full max-w-md p-8 bg-white/60 backdrop-blur-lg rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex flex-col items-center">

        {/* Título */}
        <h1 className="text-4xl md:text-5xl font-black text-green-600 mb-10 tracking-wider text-center drop-shadow-sm">
          IDENTIF&Iacute;CATE
        </h1>

        {/* Formulario */}
        <form className="w-full space-y-6" onSubmit={handleLogin}>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Usuario (email)</label>
            <input
              type="email"
              placeholder="Introduce tu email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 text-lg bg-white/90 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#008c45] focus:ring-4 focus:ring-[#008c45]/20 transition-all shadow-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Contrase&ntilde;a</label>
            <input
              type="password"
              placeholder="Introduce tu contrase&ntilde;a..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 text-lg bg-white/90 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#008c45] focus:ring-4 focus:ring-[#008c45]/20 transition-all shadow-sm"
              required
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="w-full p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 px-6 text-xl font-bold text-white bg-gradient-to-r from-[#008c45] to-[#004d26] hover:from-[#007a3c] hover:to-[#004221] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
