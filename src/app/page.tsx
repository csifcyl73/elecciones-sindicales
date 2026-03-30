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
  return (
    <div className="flex min-h-screen bg-white flex-col md:flex-row">
      {/* Barra lateral / menú colapsado */}
      <div
        className="fixed inset-y-0 left-0 z-50 bg-[#008c45] text-white border-r border-[#007036] shadow-2xl transition-all duration-300 ease-in-out w-20 hover:w-[360px] overflow-hidden flex flex-col group peer"
      >
        <div className="flex h-24 shrink-0 items-center justify-center group-hover:justify-start px-6 border-b border-[#007a3c] bg-[#009c4d]">
          <Menu className="h-8 w-8 text-white shrink-0" />
          <span className="ml-5 font-bold text-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Gesti&oacute;n Electoral
          </span>
        </div>

        <nav className="flex-1 flex flex-col py-8 space-y-4 w-full">
          <Link
            href="/admin/nacional"
            className="flex items-center px-6 py-4 hover:bg-[#007a3c] transition-colors w-full group/item"
          >
            <SpainMapIcon className="h-8 w-8 shrink-0 opacity-80 group-hover/item:opacity-100 transition-transform group-hover/item:scale-110" />
            <span className="ml-6 font-semibold text-lg opacity-0 group-hover:opacity-100 transition-all duration-300 origin-left inline-block group-hover/item:scale-110 group-hover/item:font-bold whitespace-nowrap tracking-wide">
              Administrador nacional
            </span>
          </Link>

          <Link
            href="/admin/autonomico"
            className="flex items-center px-6 py-4 hover:bg-[#007a3c] transition-colors w-full group/item"
          >
            <ExecutiveIcon className="h-8 w-8 shrink-0 opacity-80 group-hover/item:opacity-100 transition-transform group-hover/item:scale-110" />
            <span className="ml-6 font-semibold text-lg opacity-0 group-hover:opacity-100 transition-all duration-300 origin-left inline-block group-hover/item:scale-110 group-hover/item:font-bold whitespace-nowrap tracking-wide">
              Administrador Autonómico
            </span>
          </Link>

          <Link
            href="/interventor"
            className="flex items-center px-6 py-4 hover:bg-[#007a3c] transition-colors w-full group/item"
          >
            <Users className="h-8 w-8 shrink-0 opacity-80 group-hover/item:opacity-100 transition-transform group-hover/item:scale-110" />
            <span className="ml-6 font-semibold text-lg opacity-0 group-hover:opacity-100 transition-all duration-300 origin-left inline-block group-hover/item:scale-110 group-hover/item:font-bold whitespace-nowrap tracking-wide">
              Interventor
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center px-6 py-4 hover:bg-[#007a3c] transition-colors w-full group/item"
          >
            <PieChart className="h-8 w-8 shrink-0 opacity-80 group-hover/item:opacity-100 transition-transform group-hover/item:scale-110" />
            <span className="ml-6 font-semibold text-lg opacity-0 group-hover:opacity-100 transition-all duration-300 origin-left inline-block group-hover/item:scale-110 group-hover/item:font-bold whitespace-nowrap tracking-wide">
              Elecciones
            </span>
          </Link>
        </nav>
      </div>

      {/* Contenido principal animado */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 pl-20 transition-all duration-500 ease-in-out peer-hover:pl-[360px] md:peer-hover:pl-[400px] min-h-screen bg-gray-50 relative overflow-hidden">
        
        {/* Marcas de agua de fondo */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <Mail className="absolute text-[#008c45] opacity-[0.03] w-96 h-96 -top-20 -left-20 animate-[spin_60s_linear_infinite]" />
          <Inbox className="absolute text-[#008c45] opacity-[0.04] w-[500px] h-[500px] top-1/2 -right-40 -translate-y-1/2 animate-[pulse_10s_ease-in-out_infinite]" />
          <FileText className="absolute text-green-900 opacity-[0.03] w-80 h-80 -bottom-20 left-1/4 animate-[bounce_8s_infinite]" />
          <Users className="absolute text-[#008c45] opacity-[0.03] w-72 h-72 top-20 right-1/4 animate-[spin_40s_linear_infinite_reverse]" />
        </div>

        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#008c45] to-[#004d26] tracking-tighter text-center mb-12 drop-shadow-xl z-10 transition-transform duration-500 hover:scale-105">
          ELECCIONES SINDICALES
        </h1>

        <div className="relative w-72 md:w-[450px] flex items-center justify-center z-10">
          {/* Logo CSIF */}
          <img
            src="/logo-csif.png"
            alt="Logo CSIF"
            className="w-full h-auto object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-700 ease-out"
            onError={(e) => {
              e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/e/e0/Logo_CSIF.png";
              if (e.currentTarget.src.includes('Wikipedia')) {
                e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/CSIF_logo.svg/1200px-CSIF_logo.svg.png";
              }
            }}
          />
        </div>
      </main>
    </div>
  );
}
