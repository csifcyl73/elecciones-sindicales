'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent === null) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookie-consent', 'all');
    setShowBanner(false);
    // Aquí se podrían disparar los eventos de GA si fuera necesario, 
    // pero RootLayout ya lo maneja si detecta el cambio o en el siguiente load
    window.location.reload(); 
  };

  const handleRejectAll = () => {
    localStorage.setItem('cookie-consent', 'none');
    setShowBanner(false);
    window.location.reload();
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="max-w-7xl mx-auto bg-white/95 backdrop-blur-md border border-gray-200 p-6 shadow-2xl rounded-3xl flex flex-col md:flex-row items-center gap-6">
        <div className="bg-[#008c45]/10 p-3 rounded-2xl shrink-0">
          <Cookie className="w-8 h-8 text-[#008c45]" />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg font-black text-gray-900 mb-1">Tu privacidad es importante</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Utilizamos cookies propias y de terceros para mejorar tu experiencia y analizar el tráfico (Google Analytics). 
            Puedes aceptar todas, rechazarlas o configurar tus preferencias.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 shrink-0">
          <Link 
            href="/cookies"
            className="px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-all border border-gray-200"
          >
            Configurar
          </Link>
          <button 
            onClick={handleRejectAll}
            className="px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-all border border-gray-200"
          >
            Rechazar todas
          </button>
          <button 
            onClick={handleAcceptAll}
            className="px-5 py-2.5 text-sm font-bold text-white bg-[#008c45] hover:bg-[#007036] rounded-xl shadow-lg shadow-[#008c45]/20 transition-all"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}
