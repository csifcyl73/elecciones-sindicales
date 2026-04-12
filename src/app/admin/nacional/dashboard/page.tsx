"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  UserPlus,
  ShieldCheck,
  Settings2,
  BarChart3,
  Eye,
  LogOut,
  ChevronRight,
  Loader2,
  Database,
} from 'lucide-react';

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder')
);

const menuItems = [
  {
    id: 'alta-autonomico',
    label: 'Gestionar administradores autonómicos',
    description: 'Registrar y administrar administradores de comunidad autónoma',
    icon: UserPlus,
    color: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/30',
    href: '/admin/nacional/alta-autonomico',
  },
  {
    id: 'gestion-interventores',
    label: 'Alta interventor',
    description: 'Dar de alta a un interventor de mesa electoral',
    icon: ShieldCheck,
    color: 'from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-500/30',
    href: '/admin/nacional/gestion-interventores',
  },
  {
    id: 'configurar-elecciones',
    label: 'Configurar elecciones',
    description: 'Definir parámetros y configuración del proceso electoral',
    icon: Settings2,
    color: 'from-violet-500 to-purple-700',
    shadow: 'shadow-violet-500/30',
    href: '/admin/nacional/configurar-elecciones',
  },
  {
    id: 'ejecucion-informes',
    label: 'Ejecución de informes',
    description: 'Generar y exportar informes del proceso electoral',
    icon: BarChart3,
    color: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/30',
    href: '/admin/nacional/informes',
  },
  {
    id: 'unidades',
    label: 'Gestor de procesos electorales activos',
    description: 'Administrar elecciones activas y en configuración',
    icon: Database,
    color: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/30',
    href: '/admin/nacional/gestion-unidades',
  },
  {
    id: 'visualizar-elecciones',
    label: 'Visualizar elecciones',
    description: 'Consultar resultados y estado de las elecciones',
    icon: Eye,
    color: 'from-rose-500 to-pink-600',
    shadow: 'shadow-rose-500/30',
    href: '/admin/nacional/visualizar',
  },
  {
    id: 'interventor-nacional',
    label: 'Interventor Nacional (Soporte)',
    description: 'Acceso de emergencia para carga de datos y suplencia de interventores',
    icon: ShieldCheck,
    color: 'from-blue-600 to-cyan-700',
    shadow: 'shadow-blue-500/30',
    href: '/admin/nacional/interventor-nacional',
  },
  {
    id: 'gestion-sindicatos',
    label: 'Gestión Sindicatos',
    description: 'Administrar el listado de organizaciones sindicales',
    icon: Settings2,
    color: 'from-orange-400 to-amber-600',
    shadow: 'shadow-orange-500/30',
    href: '/admin/nacional/gestion-sindicatos',
  },
];

export default function AdminNacionalDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.user_metadata?.role !== 'super_nacional') {
        router.replace('/admin/nacional');
      } else {
        setUserEmail(session.user.email ?? null);
      }
      setCheckingAuth(false);
    };
    checkSession();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace('/');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c]">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-900/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-teal-900/10 blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Logo CSIF */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
            <span className="text-white font-black text-sm tracking-tight">CS</span>
          </div>
          <div>
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest">CSIF · Elecciones Sindicales</p>
            <h1 className="text-lg font-bold text-white leading-tight">Administrador Nacional</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="hidden md:block text-sm text-white/50 font-medium">
              {userEmail}
            </span>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 hover:border-rose-500/60 text-rose-400 hover:text-rose-300 font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Logout
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="relative z-10 px-6 md:px-12 py-12">
        {/* Saludo */}
        <div className="mb-12 text-center md:text-left">
          <p className="text-emerald-400 font-semibold mb-1 tracking-wide uppercase text-sm">Panel de control</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Bienvenido,{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Administrador
            </span>
          </h2>
          <p className="mt-3 text-white/50 text-lg">Selecciona una opción para continuar.</p>
        </div>

        {/* Grid de menú */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto md:mx-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={`group relative flex flex-col gap-4 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${item.shadow} text-left overflow-hidden`}
              >
                {/* Gradiente de fondo al hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${item.color} transition-opacity duration-300 rounded-2xl`} />

                {/* Icono */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg ${item.shadow} flex-shrink-0`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Texto */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-white leading-snug">
                    {item.label}
                  </h3>
                  <p className="mt-1 text-sm text-white/50 group-hover:text-white/70 transition-colors">
                    {item.description}
                  </p>
                </div>

                {/* Flecha */}
                <ChevronRight className="absolute bottom-5 right-5 w-5 h-5 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all duration-200" />
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-16 py-6 text-center text-white/30 text-xs border-t border-white/5">
        CSIF · Sistema de Elecciones Sindicales · Panel Administrador Nacional
      </footer>
    </div>
  );
}
