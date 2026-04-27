import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-[#008c45] hover:text-[#007036] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mb-6">Términos de Servicio</h1>
        <div className="prose prose-green max-w-none text-gray-600">
          <p className="lead text-lg mb-6">
            Bienvenido al Sistema de Gestión de Elecciones Sindicales. Al utilizar esta plataforma, aceptas los siguientes términos y condiciones.
          </p>
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">1. Uso del Sistema</h2>
          <p className="mb-4">
            El acceso a esta plataforma está restringido a personal autorizado (Administradores e Interventores). El uso indebido de las credenciales o el acceso no autorizado a la información electoral será motivo de revocación inmediata del acceso y posibles acciones legales.
          </p>
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">2. Propiedad de los Datos</h2>
          <p className="mb-4">
            Toda la información introducida, procesada y almacenada en este sistema es propiedad exclusiva de CSIF. Está terminantemente prohibida su extracción masiva o distribución a terceros.
          </p>
          <p className="mt-12 text-sm text-gray-400">
            Última actualización: Abril 2026
          </p>
        </div>
      </div>
    </div>
  );
}
