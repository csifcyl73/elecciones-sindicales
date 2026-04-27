import Link from 'next/link';
import { ArrowLeft, Scale, Building2, ShieldAlert, Copyright, Gavel } from 'lucide-react';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-gray-100">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-[#008c45] hover:text-[#007036] mb-10 transition-all hover:-translate-x-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="bg-[#008c45]/10 p-4 rounded-2xl">
            <Scale className="w-10 h-10 text-[#008c45]" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Términos de Servicio y Aviso Legal</h1>
            <p className="text-gray-500 font-medium mt-1 text-lg">Cumplimiento con LSSI-CE, LGDCU y RGPD</p>
          </div>
        </div>

        <div className="prose prose-green max-w-none text-gray-600 leading-relaxed">
          
          <h2 className="text-2xl font-black text-gray-900 mt-12 mb-6 flex items-center gap-3">
            <Building2 className="text-[#008c45]" />
            1. Información Identificativa (Art. 10 LSSI)
          </h2>
          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="m-0 font-medium text-gray-700">En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se facilitan los siguientes datos:</p>
            <ul className="mt-4 space-y-2 list-none p-0">
              <li className="flex gap-2"><strong>Titular:</strong> Central Sindical Independiente y de Funcionarios (CSIF)</li>
              <li className="flex gap-2"><strong>NIF:</strong> G79514378</li>
              <li className="flex gap-2"><strong>Domicilio Social:</strong> Calle Fernando El Santo 17, 28010 MADRID (MADRID)</li>
              <li className="flex gap-2"><strong>Contacto:</strong> <a href="mailto:comunicacion.institucional73@csif.es" className="text-[#008c45] font-bold">comunicacion.institucional73@csif.es</a></li>
            </ul>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mt-12 mb-6 flex items-center gap-3">
            <ShieldAlert className="text-[#008c45]" />
            2. Objeto y Condiciones de Uso
          </h2>
          <p>
            El acceso y/o uso de este portal de gestión de elecciones sindicales atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas.
          </p>
          <p>
            El usuario se compromete a hacer un uso adecuado de los contenidos y servicios que CSIF ofrece a través de su portal y con carácter enunciativo pero no limitativo, a no emplearlos para:
          </p>
          <ul>
            <li>Incurrir en actividades ilícitas, ilegales o contrarias a la buena fe y al orden público.</li>
            <li>Provocar daños en los sistemas físicos y lógicos de CSIF, de sus proveedores o de terceras personas.</li>
            <li>Intentar acceder y, en su caso, utilizar las cuentas de correo electrónico de otros usuarios o modificar sus mensajes.</li>
          </ul>

          <h2 className="text-2xl font-black text-gray-900 mt-12 mb-6 flex items-center gap-3">
            <Copyright className="text-[#008c45]" />
            3. Propiedad Intelectual e Industrial
          </h2>
          <p>
            CSIF por sí o como cesionaria, es titular de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma (a título enunciativo, imágenes, sonido, audio, vídeo, software o textos; marcas o logotipos, combinaciones de colores, estructura y diseño, selección de materiales usados, programas de ordenador necesarios para su funcionamiento, acceso y uso, etc.).
          </p>
          <p>
            Quedan expresamente prohibidas la reproducción, la distribución y la comunicación pública, incluida su modalidad de puesta a disposición, de la totalidad o parte de los contenidos de esta página web, con fines comerciales, en cualquier soporte y por cualquier medio técnico, sin la autorización de CSIF.
          </p>

          <h2 className="text-2xl font-black text-gray-900 mt-12 mb-6 flex items-center gap-3">
            <ShieldAlert className="text-[#008c45]" />
            4. Exclusión de Responsabilidad
          </h2>
          <p>
            CSIF no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del portal o la transmisión de virus o programas maliciosos o lesivos en los contenidos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo.
          </p>

          <h2 className="text-2xl font-black text-gray-900 mt-12 mb-6 flex items-center gap-3">
            <Gavel className="text-[#008c45]" />
            5. Ley Aplicable y Jurisdicción
          </h2>
          <p>
            La relación entre CSIF y el USUARIO se regirá por la normativa española vigente y cualquier controversia se someterá a los Juzgados y tribunales de la ciudad de Madrid, salvo que la ley aplicable disponga otra cosa.
          </p>

          <div className="mt-16 pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-400 font-medium">
              Última actualización: 27 de abril de 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
