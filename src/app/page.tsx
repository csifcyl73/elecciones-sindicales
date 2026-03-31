"use client";
import Link from 'next/link';
import {
  Users,
  PieChart,
  Menu,
  Mail,
  Inbox,
  FileText
} from 'lucide-react';
import spainMap from '@svg-maps/spain';

const SpainMapIcon = ({ className }: { className?: string }) => (
  <svg viewBox={spainMap.viewBox} className={className} fill="currentColor">
    {spainMap.locations.map((location: any) => (
      <path key={location.id} d={location.path} stroke="none" />
    ))}
  </svg>
);

const ExecutiveIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="7" r="4" fill="currentColor" stroke="none" opacity="0.8" />
    <path d="M5 22v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" fill="currentColor" stroke="none" opacity="0.8" />
    <path d="M12 21l-1-4 1-1 1 1-1 4z" fill="#008c45" stroke="none" />
  </svg>
);

export default function Home() {
  const navItems = [
    {
      title: "Administrador Nacional",
      href: "/admin/nacional",
      icon: SpainMapIcon,
      description: "Configuración global de elecciones y unidades electorales."
    },
    {
      title: "Administrador Autonómico",
      href: "/admin/autonomico",
      icon: ExecutiveIcon,
      description: "Gestión de interventores y seguimiento regional."
    },
    {
      title: "Interventor",
      href: "/interventor",
      icon: Users,
      description: "Carga de votos y supervisión de actas en tiempo real."
    },
    {
      title: "Elecciones",
      href: "/dashboard",
      icon: PieChart,
      description: "Visualización de resultados y cálculo proporcional."
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col font-sans selection:bg-green-100 selection:text-green-900">
      
      {/* Contenido Principal (Sin Sidebar) */}
      <main className="flex-1 flex flex-col items-center justify-center py-10 md:py-16 px-6 min-h-screen relative overflow-hidden">
        
        {/* Marcas de agua Animadas (Fondo) */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <Mail className="absolute text-[#008c45] opacity-[0.03] w-64 h-64 md:w-80 md:h-80 -top-10 -left-10 animate-[spin_60s_linear_infinite]" />
          <Inbox className="absolute text-[#008c45] opacity-[0.04] w-80 h-80 md:w-96 md:h-96 top-1/3 -right-20 animate-[pulse_10s_ease-in-out_infinite]" />
          <FileText className="absolute text-green-900 opacity-[0.02] w-64 h-64 md:w-80 md:h-80 bottom-0 left-1/4 animate-[bounce_8s_infinite]" />
          <Users className="absolute text-[#008c45] opacity-[0.03] w-48 h-48 md:w-64 md:h-64 top-10 right-1/4 animate-[spin_40s_linear_infinite_reverse]" />
        </div>

        {/* Encabezado Compacto */}
        <div className="relative z-10 flex flex-col items-center text-center mb-8 md:mb-12 px-4">
          <div className="relative w-32 md:w-48 mb-8 flex items-center justify-center transition-transform hover:rotate-3 duration-700">
            <img
              src="/logo-csif.png"
              alt="Logo CSIF"
              className="w-full h-auto object-contain drop-shadow-xl"
              onError={(e) => {
                e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/CSIF_logo.svg/1200px-CSIF_logo.svg.png";
              }}
            />
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#008c45] to-[#004d26] tracking-tighter mb-4 drop-shadow-lg animate-in fade-in slide-in-from-top-4 duration-700">
            ELECCIONES SINDICALES
          </h1>
          
          <p className="max-w-xl text-base md:text-lg text-gray-500 font-medium leading-relaxed opacity-80 mb-6">
            Gestión Integral de Procesos Electorales
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-[#008c45] to-green-300 rounded-full shadow-sm"></div>
        </div>

        {/* Rejilla de Acceso Rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-6xl z-10 px-4 md:px-0">
          {navItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="group relative flex flex-col items-center p-6 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,140,69,0.12)] transition-all duration-500 hover:-translate-y-2 overflow-hidden text-center"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#008c45] to-green-300 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-white rounded-2xl group-hover:from-[#008c45] group-hover:to-[#007036] transition-colors duration-500 shadow-inner">
                <item.icon className="w-10 h-10 text-[#008c45] group-hover:text-white transition-colors duration-500" />
              </div>

              <h3 className="text-lg md:text-xl font-black text-gray-800 mb-2 tracking-tight group-hover:text-[#008c45] transition-colors">
                {item.title}
              </h3>

              <p className="text-gray-400 group-hover:text-gray-600 transition-colors text-xs font-medium leading-relaxed line-clamp-2">
                {item.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Footer info (Minimalista) */}
        <div className="mt-12 md:mt-16 text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold z-10">
          &copy; 2026 CSIF Nacional
        </div>

        <style jsx global>{`
          @keyframes slide-in-top {
            0% { transform: translateY(-10px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          .animate-in {
            animation: slide-in-top 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>
      </main>
    </div>
  );
}

