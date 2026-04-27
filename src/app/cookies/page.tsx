import Link from 'next/link';
import { ArrowLeft, Cookie } from 'lucide-react';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-[#008c45] hover:text-[#007036] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <Cookie className="w-8 h-8 text-[#008c45]" />
          <h1 className="text-3xl font-black text-gray-900">Configuración de Cookies</h1>
        </div>
        <div className="prose prose-green max-w-none text-gray-600">
          <p className="lead text-lg mb-6">
            Utilizamos cookies técnicas estrictamente necesarias y cookies analíticas para mejorar la experiencia de usuario.
          </p>
          
          <div className="space-y-6 mt-8">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-800 m-0">Cookies Técnicas (Estrictamente Necesarias)</h3>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">Obligatorias</span>
              </div>
              <p className="text-sm">Se utilizan para mantener la sesión abierta de los administradores e interventores. Sin ellas, el sistema de seguridad no funcionaría. (Supabase Auth)</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-800 m-0">Cookies Analíticas (Google Analytics)</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">Activas</span>
              </div>
              <p className="text-sm">Utilizamos Google Analytics (GA4) para entender qué partes de la aplicación son más utilizadas y mejorar el rendimiento de la plataforma.</p>
              
              <div className="mt-4 flex gap-4">
                <button className="px-4 py-2 bg-[#008c45] text-white text-sm font-semibold rounded-lg hover:bg-[#007036] transition-colors">
                  Aceptar Analíticas
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors">
                  Rechazar Analíticas
                </button>
              </div>
            </div>
          </div>

          <p className="mt-12 text-sm text-gray-400">
            Puede cambiar esta configuración en cualquier momento desde esta misma página.
          </p>
        </div>
      </div>
    </div>
  );
}
