"use client";
import React, { useEffect, useState, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export const SearchableCombobox = ({ 
  options, 
  value, 
  onChange, 
  placeholder,
  className = ""
}: { 
  options: any[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find(o => o.id?.toString() === value?.toString());
  const filtered = options.filter(o => (o.siglas || o.nombre || o.nombre_completo || '').toUpperCase().includes(term.toUpperCase()));

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)} className="w-full bg-black/40 border-2 border-white/5 rounded-[30px] px-8 py-6 flex items-center justify-between cursor-pointer focus:outline-none hover:border-emerald-500/50 appearance-none transition-all shadow-inner">
         <span className={`font-black text-sm uppercase ${selected ? 'text-white' : 'text-white/40'} line-clamp-1 text-left`}>
            {selected ? (selected.siglas || selected.nombre || selected.nombre_completo).toUpperCase() : placeholder}
         </span>
         <ChevronDown className={`w-6 h-6 outline-none opacity-30 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute top-[110%] left-0 w-full bg-[#111827] border border-white/20 rounded-[30px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-[60] flex flex-col backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-white/10 relative">
            <Search className="w-4 h-4 text-white/30 absolute left-8 top-1/2 -translate-y-1/2" />
            <input type="text" autoFocus className="w-full bg-black/40 text-white font-black text-xs uppercase rounded-2xl pl-12 pr-6 py-4 border-2 border-white/10 focus:outline-none focus:border-emerald-500 transition-all" placeholder="BUSCAR..." value={term} onChange={e => setTerm(e.target.value)} />
          </div>
          <div className="max-h-[300px] overflow-y-auto hidden-scrollbar">
             {filtered.length > 0 ? filtered.slice(0, 100).map(o => (
               <div key={o.id} onClick={() => { onChange(o.id.toString()); setIsOpen(false); setTerm(""); }} className="px-8 py-5 hover:bg-emerald-500/10 cursor-pointer border-b border-white/5 font-black uppercase text-[12px] text-white/50 hover:text-white transition-all flex justify-between items-center">
                 <div className="flex flex-col text-left">
                   <span className="text-white text-sm">{o.siglas || o.nombre || o.nombre_completo}</span>
                   {o.siglas && (o.nombre || o.nombre_completo) && (
                     <span className="text-[9px] text-white/30 lowercase">{(o.nombre || o.nombre_completo)}</span>
                   )}
                 </div>
                 {value === o.id?.toString() && <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-2" />}
               </div>
             )) : <div className="p-8 text-center text-white/30 text-[10px] uppercase font-black">SIN COINCIDENCIAS</div>}
          </div>
        </div>
      )}
    </div>
  );
};
