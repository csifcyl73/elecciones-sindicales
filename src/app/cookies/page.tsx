'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Cookie, ShieldCheck, BarChart3, Lock } from 'lucide-react';

export default function CookiesPage() {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    setConsent(localStorage.getItem('cookie-consent'));
  }, []);

  const updateConsent = (value: string) => {
    localStorage.setItem('cookie-consent', value);
    setConsent(value);
    // Forzamos recarga para que los scripts de tracking se activen/desactiven
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-gray-100">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-[#008c45] hover:text-[#007036] mb-10 transition-all hover:-translate-x-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="bg-[#008c45]/10 p-4 rounded-2xl">
            <Cookie className="w-10 h-10 text-[#008c45]" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Política de Cookies</h1>
            <p className="text-gray-500 font-medium mt-1 text-lg">Transparencia y control sobre tu privacidad</p>
          </div>
        </div>

        <div className="prose prose-green max-w-none text-gray-600 leading-relaxed">
          <p className="text-xl font-medium text-gray-700 mb-8">
            En cumplimiento con la LSSI y el RGPD, te informamos de forma clara sobre qué cookies utilizamos y cómo puedes gestionarlas.
          </p>
          
          <h2 className="text-2xl font-black text-gray-900 mt-12 mb-6 flex items-center gap-3">
            <ShieldCheck className="text-[#008c45]" />
            ¿Qué son las cookies?
          </h2>
          <p>
            Las cookies son pequeños archivos de texto que se almacenan en tu navegador cuando visitas casi cualquier página web. 
            Su utilidad es que la web sea capaz de recordar tu visita cuando vuelvas a navegar por esa página, 
            mantener tu sesión iniciada o analizar el rendimiento del sitio.
          </p>

          <h2 className="text-2xl font-black text-gray-900 mt-12 mb-6 flex items-center gap-3">
            <Lock className="text-[#008c45]" />
            Gestión de Preferencias
          </h2>
          
          <div className="grid gap-6 mt-8">
            {/* Técnicas */}
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 transition-all hover:border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl shadow-sm">
                    <ShieldCheck className="text-green-600 w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 m-0">Cookies Técnicas</h3>
                </div>
                <span className="px-4 py-1.5 bg-green-100 text-green-800 text-xs font-black rounded-full uppercase tracking-wider shadow-sm">Obligatorias</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Son esenciales para el funcionamiento de la plataforma. Permiten la autenticación de administradores, 
                la seguridad de las peticiones y la integridad del sistema. No se pueden desactivar.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <span>Proveedor: Supabase (Auth)</span>
                <span className="text-gray-200">|</span>
                <span>Finalidad: Seguridad y Sesión</span>
              </div>
            </div>

            {/* Analíticas */}
            <div className={`p-6 rounded-3xl border transition-all shadow-sm ${consent === 'all' ? 'bg-green-50/30 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl shadow-sm">
                    <BarChart3 className="text-blue-600 w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 m-0">Cookies Analíticas</h3>
                </div>
                <div className="flex items-center gap-2">
                   {consent === 'all' ? (
                     <span className="px-4 py-1.5 bg-green-500 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-md">Activas</span>
                   ) : (
                     <span className="px-4 py-1.5 bg-gray-200 text-gray-500 text-xs font-black rounded-full uppercase tracking-wider shadow-sm">Desactivadas</span>
                   )}
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Utilizamos Google Analytics (GA4) para recopilar información anónima sobre cómo los usuarios interactúan con la web. 
                Esto nos ayuda a mejorar continuamente la plataforma y solucionar errores de rendimiento.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => updateConsent('all')}
                  className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm ${consent === 'all' ? 'bg-[#008c45] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  Permitir Analíticas
                </button>
                <button 
                  onClick={() => updateConsent('none')}
                  className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm ${consent !== 'all' ? 'bg-gray-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  Rechazar Analíticas
                </button>
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-gray-400">
                <span>Proveedor: Google (GA4)</span>
                <span className="text-gray-200">|</span>
                <span>Finalidad: Estadística y Rendimiento</span>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Información Adicional</h2>
            <p className="text-sm">
              Esta configuración se guarda en tu navegador por un periodo de 24 meses o hasta que borres el historial. 
              Puedes volver a esta página en cualquier momento para cambiar tus preferencias desde el enlace en el pie de página.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
