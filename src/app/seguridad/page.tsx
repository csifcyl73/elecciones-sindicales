import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function SeguridadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-[#008c45] hover:text-[#007036] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-8 h-8 text-[#008c45]" />
          <h1 className="text-3xl font-black text-gray-900">Política de Privacidad y Seguridad</h1>
        </div>
        <div className="prose prose-green max-w-none text-gray-600">
          <p className="lead text-lg mb-6">
            En cumplimiento con el RGPD, detallamos cómo tratamos y protegemos la información electoral y los datos de nuestros usuarios.
          </p>
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">Protección de Datos</h2>
          <p className="mb-4">
            Todos los datos almacenados en nuestra base de datos utilizan cifrado en reposo (Row Level Security en Supabase) y se transmiten exclusivamente bajo el protocolo HTTPS. El acceso a los datos de las actas está estrictamente limitado a los interventores asignados a cada mesa electoral.
          </p>
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">Registro de Actividad</h2>
          <p className="mb-4">
            Para garantizar la integridad del proceso electoral, el sistema registra eventos críticos (auditoría), incluyendo la IP de origen, la acción realizada y el usuario autenticado que ejecutó la carga de resultados.
          </p>
          <p className="mt-12 text-sm text-gray-400">
            Responsable del Tratamiento: CSIF Nacional
          </p>
        </div>
      </div>
    </div>
  );
}
