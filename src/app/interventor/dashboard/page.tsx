"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, User, ClipboardList, LayoutDashboard } from 'lucide-react';

export default function InterventorDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.user_metadata?.role !== 'interventor') {
        router.replace('/interventor');
      } else {
        setUserEmail(session.user.email ?? null);
      }
    };
    checkSession();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/interventor');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar Superior */}
      <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            Panel de <span className="text-emerald-700">Interventor</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Activo como</span>
            <span className="text-sm font-semibold text-gray-700">{userEmail}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Salir
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card de Ejemplo */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <LayoutDashboard className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Mi Mesa Electoral</h3>
            <p className="text-gray-500 text-sm">Gestiona el censo y la entrada de votos de tu mesa asignada.</p>
            <button className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
              Pr&oacute;ximamente
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
