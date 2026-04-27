"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, ShieldAlert, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PrivacidadNacionalPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<{ id: string, email: string, nombre: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.user_metadata?.role !== 'super_nacional') {
        router.replace('/admin/nacional');
        return;
      }
      setUserData({
        id: session.user.id,
        email: session.user.email || '',
        nombre: session.user.user_metadata?.full_name || session.user.user_metadata?.nombre || 'Administrador Nacional',
      });
    };
    fetchUser();
  }, [router, supabase]);

  const handleBaja = async () => {
    if (!userData) return;
    
    const confirmacion = window.confirm(
      "Estás a punto de solicitar tu BAJA DEFINITIVA como Administrador Nacional y el borrado de tus datos (Derecho de Supresión - LOPD).\n\n" +
      "Perderás el acceso al sistema inmediatamente. Tu correo será añadido a una lista de exclusión para no volver a ser importado.\n\n" +
      "⚠️ ATENCIÓN: Si eres el único administrador nacional, la plataforma podría quedarse sin un gestor principal.\n\n" +
      "¿Estás completamente seguro de que deseas proceder?"
    );

    if (!confirmacion) return;

    setLoading(true);
    try {
      const res = await fetch('/api/lopd/baja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          email: userData.email,
          nombre: userData.nombre
        })
      });

      if (res.ok) {
        alert("Solicitud de baja tramitada. Tus datos han sido eliminados de la base de datos activa y se ha registrado tu solicitud para evitar futuros envíos.");
        await supabase.auth.signOut();
        router.replace('/admin/nacional');
      } else {
        const error = await res.json();
        alert(`Error al procesar la baja: ${error.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-gray-100">
        <Link href="/admin/nacional/dashboard" className="inline-flex items-center text-sm font-bold text-emerald-600 hover:text-emerald-700 mb-10 transition-all hover:-translate-x-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al panel nacional
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="bg-emerald-50 p-4 rounded-2xl">
            <ShieldAlert className="w-10 h-10 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Privacidad y LOPD</h1>
            <p className="text-gray-500 font-medium mt-1">Gestión de tus derechos de protección de datos</p>
          </div>
        </div>

        <div className="prose prose-emerald max-w-none text-gray-600 leading-relaxed mb-10">
          <p>
            De acuerdo con lo establecido en el <strong>Reglamento General de Protección de Datos (RGPD)</strong> y en la <strong>Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD)</strong>, tienes derecho a solicitar la supresión de tus datos personales alojados en nuestra plataforma.
          </p>
          <p>
            Al solicitar la baja definitiva:
          </p>
          <ul>
            <li>Tu usuario y acceso de administrador a la plataforma serán revocados inmediatamente.</li>
            <li>Tus datos se incluirán en un listado interno e independiente de exclusión (<strong>Lista de supresión</strong>), cuya única finalidad es cruzar información con futuros volcados o backups para garantizar que no vuelvas a ser dado de alta sin tu consentimiento explícito.</li>
          </ul>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-black text-red-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" /> Zona de Peligro
          </h2>
          <p className="text-red-700 text-sm mb-6">
            Esta acción es irreversible y surtirá efecto de inmediato.
          </p>
          <button
            onClick={handleBaja}
            disabled={loading}
            className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Solicitar Baja y Borrado de Datos'}
          </button>
        </div>
      </div>
    </div>
  );
}
