"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Loader2,
  MapPin,
  Building2,
  Users,
  Lock,
  BarChart,
  Target,
  FileDown
} from 'lucide-react';

export default function DetalleEleccionPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [bloqueando, setBloqueando] = useState(false);
  const [datos, setDatos] = useState<any>(null);

  const [showModalBloqueo, setShowModalBloqueo] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const resp = await fetch(`/api/admin/visualizar/${id}`);
      if (!resp.ok) throw new Error("Error cargando datos");
      const d = await resp.json();
      setDatos(d);
    } catch (err) {
      console.error(err);
      alert('Error cargando los detalles de la elección.');
    } finally {
      setLoading(false);
    }
  };

  const confirmarBloqueo = async () => {
    setShowModalBloqueo(false);
    setBloqueando(true);
    try {
      const resp = await fetch(`/api/admin/visualizar/${id}`, { method: 'POST' });
      if (!resp.ok) throw new Error("Error al bloquear");
      
      // Recargar datos para mostrar estado congelado
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Error al bloquear la elección.');
    } finally {
       setBloqueando(false);
    }
  };

  const handleDescargarPDF = async () => {
    try {
       // Importamos dinámicamente para evitar problemas de SSR con Next.js
       const html2pdf = (await import('html2pdf.js')).default;
       const element = document.getElementById('dashboard-pdf-content');
       
       if (!element) throw new Error("Contenedor no encontrado");

       const opt = {
         margin:       [10, 10, 10, 10] as [number, number, number, number],
         filename:     `Informe_Electoral_${datos.unidad.nombre.replace(/ /g, '_')}.pdf`,
         image:        { type: 'jpeg' as const, quality: 0.98 },
         html2canvas:  { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#0a101f' },
         jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
       };

       html2pdf().from(element).set(opt).save();
    } catch (e) {
       console.error("Error generando PDF:", e);
       alert("Ocurrió un error intentando generar el PDF.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a101f] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-rose-400 animate-spin" />
      </div>
    );
  }

  if (!datos || !datos.unidad) {
    return <div className="min-h-screen bg-[#0a101f] text-white p-12 text-center">Elección no encontrada</div>;
  }

  const { unidad, mesas, votos, consolidados } = datos;

  // Cálculos globales
  const isBloqueada = unidad.estado === 'congelada';
  const censoTotal = mesas.reduce((acc: number, m: any) => acc + (m.censo_real || 0), 0);
  const votosBlancosTotales = mesas.reduce((acc: number, m: any) => acc + (m.votos_blancos || 0), 0);
  const votosNulosTotales = mesas.reduce((acc: number, m: any) => acc + (m.votos_nulos || 0), 0);
  const votosCandidaturasTotales = votos.reduce((acc: number, v: any) => acc + (v.votos_obtenidos || 0), 0);
  const votosValidosTotales = votosCandidaturasTotales + votosBlancosTotales;
  const votosEmitidosTotales = votosValidosTotales + votosNulosTotales;
  
  const abstencionTotal = censoTotal > 0 ? censoTotal - votosEmitidosTotales : 0;
  const abstencionPct = censoTotal > 0 ? ((abstencionTotal / censoTotal) * 100).toFixed(2) : '0.00';

  const isDoble = unidad.modo_colegio === 'doble';

  const getColegio = (mesaId: string) => {
     const m = mesas.find((x:any) => x.id === mesaId);
     if (!m) return 'unico';
     if (m.nombre_identificador.toUpperCase().includes('[TÉCNICOS]')) return 'tecnicos';
     if (m.nombre_identificador.toUpperCase().includes('[ESPECIALISTAS]')) return 'especialistas';
     return 'unico';
  };

  // Agrupaciones
  const votosPorSindicatoGlobal: Record<string, { siglas: string; votos: number }> = {};
  const votosSindicatoTec: Record<string, { siglas: string; votos: number }> = {};
  const votosSindicatoEsp: Record<string, { siglas: string; votos: number }> = {};
  
  let votosCandTec = 0;
  let votosCandEsp = 0;

  votos.forEach((v: any) => {
    const col = getColegio(v.mesa_id);
    const sid = v.sindicato_id;
    const sName = v.sindicatos?.siglas || '?';
    const vObt = v.votos_obtenidos || 0;

    if (!votosPorSindicatoGlobal[sid]) votosPorSindicatoGlobal[sid] = { siglas: sName, votos: 0 };
    votosPorSindicatoGlobal[sid].votos += vObt;

    if (col === 'tecnicos') {
       if (!votosSindicatoTec[sid]) votosSindicatoTec[sid] = { siglas: sName, votos: 0 };
       votosSindicatoTec[sid].votos += vObt;
       votosCandTec += vObt;
    } else if (col === 'especialistas') {
       if (!votosSindicatoEsp[sid]) votosSindicatoEsp[sid] = { siglas: sName, votos: 0 };
       votosSindicatoEsp[sid].votos += vObt;
       votosCandEsp += vObt;
    }
  });

  const umbralElectoralGlobal = votosCandidaturasTotales * 0.05;

  let modoReparto = "oficial";
  let delegadosARepartirGlobal = [...consolidados];
  let delegadosTecnicos: any[] = [];
  let delegadosEspecialistas: any[] = [];

  const repartirHare = (votosPorSid: any, totalVotosCand: number, numA_Elegir: number) => {
     if (numA_Elegir === 0 || totalVotosCand === 0) return [];
     const umbral = totalVotosCand * 0.05;
     const candidaturasSuperan = Object.entries(votosPorSid).filter(([_, data]:any) => data.votos >= umbral);
     if (candidaturasSuperan.length === 0) return [];

     const cociente = totalVotosCand / numA_Elegir;
     let escanios: Record<string, number> = {};
     let escaniosDirectos: Record<string, number> = {};
     let restos: { sid: string, resto: number }[] = [];
     let repartidos = 0;

     candidaturasSuperan.forEach(([sid, data]:any) => {
         const div = data.votos / cociente;
         const ent = Math.floor(div);
         escanios[sid] = ent; escaniosDirectos[sid] = ent;
         repartidos += ent;
         restos.push({ sid, resto: div - ent });
     });

     restos.sort((a, b) => b.resto - a.resto);
     let idx = 0;
     while (repartidos < numA_Elegir && idx < restos.length) {
        escanios[restos[idx].sid]++;
        repartidos++; idx++;
     }

     return Object.entries(escanios)
        .filter(([_, esc]) => esc > 0)
        .map(([sid, esc]) => ({
           sindicato_id: sid, delegados_totales: esc,
           sindicatos: { siglas: votosPorSid[sid].siglas },
           detalle_reparto: { directos: escaniosDirectos[sid]||0, restos: esc - (escaniosDirectos[sid]||0) }
        })).sort((a,b) => b.delegados_totales - a.delegados_totales);
  };

  if (consolidados.length === 0 && votosCandidaturasTotales > 0) {
     modoReparto = isBloqueada ? "definitivo" : "provisional";

     if (!isDoble) {
        delegadosARepartirGlobal = repartirHare(votosPorSindicatoGlobal, votosCandidaturasTotales, unidad.delegados_a_elegir || 0);
     } else {
        delegadosTecnicos = repartirHare(votosSindicatoTec, votosCandTec, unidad.del_tecnicos || 0);
        delegadosEspecialistas = repartirHare(votosSindicatoEsp, votosCandEsp, unidad.del_especialistas || 0);

        // Compute Global
        const dGlobalMap: Record<string, any> = {};
        [...delegadosTecnicos, ...delegadosEspecialistas].forEach(d => {
            if (!dGlobalMap[d.sindicato_id]) {
                dGlobalMap[d.sindicato_id] = { ...d, delegados_totales: 0, detalle_reparto: { directos: 0, restos: 0 } };
            }
            dGlobalMap[d.sindicato_id].delegados_totales += d.delegados_totales;
            dGlobalMap[d.sindicato_id].detalle_reparto.directos += d.detalle_reparto.directos;
            dGlobalMap[d.sindicato_id].detalle_reparto.restos += d.detalle_reparto.restos;
        });

        delegadosARepartirGlobal = Object.values(dGlobalMap).sort((a:any, b:any) => b.delegados_totales - a.delegados_totales);
     }
  }

  // Componente de Renderizado de un Box Grid de Sindicatos
  const SindicatosGridBox = ({ arrayDels }: { arrayDels: any[] }) => {
      if (arrayDels.length === 0) return <div className="p-8 bg-white/5 border border-white/10 rounded-3xl text-center"><p className="text-xs uppercase font-black tracking-widest text-white/40">Sin cálculo disponible</p></div>;
      
      return (
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {arrayDels.map((c: any) => (
                <div key={c.sindicato_id} className={`group relative p-6 rounded-3xl border text-center ${c.sindicatos.siglas === 'CSIF' ? 'bg-gradient-to-b from-emerald-500/20 to-emerald-900/40 border-emerald-500/50 hover:border-emerald-500' : 'bg-white/5 border-white/10 hover:border-white/30'} transition-colors cursor-default`}>
                    {c.detalle_reparto && (
                       <div className="absolute -top-[88px] left-1/2 -translate-x-1/2 bg-[#0f172a] text-white px-5 py-3 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 scale-95 group-hover:scale-100 whitespace-nowrap pointer-events-none z-20 border border-white/10 shadow-2xl">
                         <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 border-b border-white/10 pb-1">Desglose</p>
                         <div className="flex gap-4 mt-2">
                            <div className="text-center">
                               <span className="text-[10px] font-bold text-white/60 uppercase">Directos</span>
                               <p className="text-emerald-400 font-black text-xl leading-none">{c.detalle_reparto.directos}</p>
                            </div>
                            <div className="w-[1px] bg-white/10" />
                            <div className="text-center">
                               <span className="text-[10px] font-bold text-white/60 uppercase">Por Resto</span>
                               <p className="text-amber-400 font-black text-xl leading-none">{c.detalle_reparto.restos}</p>
                            </div>
                         </div>
                         <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-x-[8px] border-x-transparent border-t-[8px] border-t-white/10" />
                         <div className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 border-x-[8px] border-x-transparent border-t-[8px] border-t-[#0f172a]" />
                       </div>
                    )}
                    <p className={`text-xl font-black mb-2 ${c.sindicatos.siglas === 'CSIF' ? 'text-emerald-400' : 'text-white'}`}>{c.sindicatos.siglas}</p>
                    <p className={`text-4xl font-black ${c.sindicatos.siglas === 'CSIF' ? 'text-emerald-400' : 'text-white/80'}`}>{c.delegados_totales}</p>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">Delegados</p>
                </div>
            ))}
         </div>
      );
  };

  const VotosList = ({ mapVotos, total, colUmbral }: { mapVotos: any, total: number, colUmbral: number }) => {
      return (
         <div className="space-y-3">
             {Object.entries(mapVotos).map(([sid, data]: any) => {
                 const noSuperaUmbral = data.votos < colUmbral;
                 return (
                     <div key={sid} className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className={`font-black uppercase tracking-widest flex items-center gap-2 ${noSuperaUmbral ? 'text-rose-500/80 decoration-rose-500/30' : data.siglas === 'CSIF' ? 'text-emerald-400' : 'text-white'}`}>
                          <span className={noSuperaUmbral ? 'line-through' : ''}>{data.siglas}</span>
                          {noSuperaUmbral && <span className="text-[8px] text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md no-underline">&lt;5%</span>}
                        </span>
                        <span className={`font-mono text-lg font-bold ${noSuperaUmbral ? 'text-rose-500/50' : 'text-white'}`}>{data.votos}</span>
                     </div>
                 );
             })}
             <div className="flex justify-between items-center pt-2">
                <span className="font-black uppercase tracking-widest text-white/40">Total Válidos Cand.</span>
                <span className="font-mono text-2xl font-black text-white">{total}</span>
             </div>
         </div>
      );
  };

  return (
    <div className="min-h-screen bg-[#0a101f] text-white p-4 md:p-8 overflow-hidden relative">
      <div id="dashboard-pdf-content" className="max-w-7xl mx-auto relative z-10 space-y-8 bg-[#0a101f]">
        
        {/* ENCABEZADO Y ACCIONES */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
          <div className="space-y-4">
             <Link href="/admin/nacional/visualizar" data-html2canvas-ignore="true" className="inline-flex items-center gap-2 text-white/30 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
               <ArrowLeft className="w-4 h-4" /> Volver al listado
             </Link>
             <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mt-4 text-white">
                Dashboard <br /> <span className="text-rose-400">Electoral</span>
             </h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className={`px-6 py-4 rounded-2xl border flex items-center gap-3 backdrop-blur-md ${isBloqueada ? 'bg-blue-500/10 border-blue-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                {isBloqueada ? <Lock className="w-5 h-5 text-blue-400" /> : <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />}
                <div>
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isBloqueada ? 'Estado Oficial' : 'Estado del Proceso'}</p>
                   <p className={`font-black uppercase tracking-tight ${isBloqueada ? 'text-blue-400' : 'text-emerald-400'}`}>
                     {isBloqueada ? 'RESULTADOS BLOQUEADOS' : 'ESCRUTINIO ABIERTO'}
                   </p>
                </div>
            </div>

            <div data-html2canvas-ignore="true" className="flex flex-col sm:flex-row gap-4 items-end">
                <button onClick={handleDescargarPDF} className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-sm flex items-center gap-2 text-white">
                   <FileDown className="w-5 h-5 text-emerald-400" /> Informe PDF
                </button>

                {!isBloqueada && (
                    <button onClick={() => setShowModalBloqueo(true)} disabled={bloqueando} className="px-6 py-4 bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-[0_10px_30px_rgba(225,29,72,0.3)] flex items-center gap-2 disabled:opacity-50">
                       {bloqueando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />} Bloquear
                    </button>
                )}
            </div>
          </div>
        </div>

        {/* INFO BÁSICA UNIDAD ELECTORAL */}
        <div className="bg-[#111827]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative">
           {isDoble && <div className="absolute top-0 right-8 bg-amber-500/20 text-amber-500 font-black text-[10px] px-4 py-1 rounded-b-xl tracking-widest border border-amber-500/30 uppercase border-t-0">Modo Dos Colegios Habilitado</div>}
           <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">{unidad.nombre}</h2>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Proceso Electoral</p>
                 <p className="text-sm font-bold text-amber-400 uppercase">{unidad.proceso?.nombre || 'NO PROCEDE'}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Provincia / Municipio</p>
                 <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-white/40" /> <span className="text-sm font-bold text-white uppercase">{unidad.provincias?.nombre || '-'}</span></div>
                 {unidad.municipios?.nombre && <p className="text-xs font-medium text-white/60 pl-4">{unidad.municipios?.nombre}</p>}
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Sector</p>
                 <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-white/40" /> <span className="text-sm font-bold text-white uppercase">{unidad.sectores?.nombre || '-'}</span></div>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Censo / Delegados Globales</p>
                 <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-white">{censoTotal}</span> <span className="text-white/30">|</span>
                    <span className="text-xl font-black text-rose-400 group flex items-center gap-1" title="Delegados a Elegir Globales"><Users className="w-4 h-4"/> {isDoble ? ((unidad.del_tecnicos || 0) + (unidad.del_especialistas || 0)) : (unidad.delegados_a_elegir || 0)}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* REPARTO DE DELEGADOS */}
        <div className="mb-10 space-y-6">
           <h3 className={`text-xl font-black uppercase tracking-widest pl-2 border-l-4 ${modoReparto === 'provisional' ? 'border-amber-400 text-amber-400' : 'border-emerald-400 text-white/80'} shadow-sm flex items-center gap-2`}>
              <Target className="w-6 h-6" /> 
              {modoReparto === 'provisional' 
                 ? (isDoble ? 'Repartos Provisionales (Cocientes y Restos)' : 'Reparto Provisional Único') 
                 : 'REPARTO DEFINITIVO DE DELEGADOS'}
           </h3>

           {!isDoble ? (
               <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
                   <h4 className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest mb-4">Comité Total / Junta General</h4>
                   <SindicatosGridBox arrayDels={delegadosARepartirGlobal} />
               </div>
           ) : (
               <div className="space-y-4">
                  {/* GLOBAL DOBLE */}
                  <div className="bg-emerald-900/10 p-6 rounded-3xl border border-emerald-500/20 shadow-inner overflow-hidden relative">
                      <div className="absolute top-0 right-0 bg-emerald-500/20 px-3 py-1 rounded-bl-xl border-b border-l border-emerald-500/30">
                         <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Suma Agregada Comité</p>
                      </div>
                      <h4 className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest mb-4">Reparto Global (Suma de Ambos Colegios)</h4>
                      <SindicatosGridBox arrayDels={delegadosARepartirGlobal} />
                  </div>
                  
                  {/* SUB-COLEGIOS */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {modoReparto === 'provisional' && (
                         <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
                             <h4 className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-4">Colegio Técnicos y Administrativos <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white ml-2">{unidad.del_tecnicos || 0} Del</span></h4>
                             <SindicatosGridBox arrayDels={delegadosTecnicos} />
                         </div>
                      )}
                      
                      {modoReparto === 'provisional' && (
                         <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
                             <h4 className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-4">Colegio Especialistas No Cualificados <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white ml-2">{unidad.del_especialistas || 0} Del</span></h4>
                             <SindicatosGridBox arrayDels={delegadosEspecialistas} />
                         </div>
                      )}
                  </div>
               </div>
           )}

        </div>

        {/* TOTALES DE VOTOS CANDIDATURAS Y METRICAS GLOBAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            
            {/* VOTOS CANDIDATURAS */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 h-full flex flex-col justify-between">
               <div>
                   <h4 className="text-[11px] font-black text-white/50 uppercase tracking-[0.3em] mb-6">Totales de Votos a Candidaturas</h4>
                   
                   {!isDoble ? (
                      <VotosList mapVotos={votosPorSindicatoGlobal} total={votosCandidaturasTotales} colUmbral={votosCandidaturasTotales * 0.05} />
                   ) : (
                      <div className="space-y-6">
                         <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <h5 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Global Sumado</h5>
                            <VotosList mapVotos={votosPorSindicatoGlobal} total={votosCandidaturasTotales} colUmbral={votosCandidaturasTotales * 0.05} />
                         </div>
                         <div className="bg-black/20 p-4 rounded-2xl border border-white/5 pt-4">
                            <h5 className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-3">Técnicos y Administrativos</h5>
                            <VotosList mapVotos={votosSindicatoTec} total={votosCandTec} colUmbral={votosCandTec * 0.05} />
                         </div>
                         <div className="bg-black/20 p-4 rounded-2xl border border-white/5 pt-4">
                            <h5 className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-3">Especialistas y No C.</h5>
                            <VotosList mapVotos={votosSindicatoEsp} total={votosCandEsp} colUmbral={votosCandEsp * 0.05} />
                         </div>
                      </div>
                   )}
               </div>
            </div>
            
            {/* METRICAS Y DESGLOSE MESAS */}
            <div className="space-y-6">
                
                {/* METRICAS */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                     <h4 className="text-[11px] font-black text-white/50 uppercase tracking-[0.3em] mb-4">Métricas Globales de la Elección</h4>
                     <div className="space-y-3">
                         <div className="bg-black/40 rounded-2xl p-4 flex justify-between items-center border border-white/5">
                            <span className="text-xs font-black uppercase text-white/50 tracking-widest">Votos Blancos</span>
                            <div className="text-right">
                               <span className="font-mono text-xl block leading-none">{votosBlancosTotales}</span>
                               <span className="text-[9px] font-black text-white/30 uppercase">{votosEmitidosTotales > 0 ? ((votosBlancosTotales/votosEmitidosTotales)*100).toFixed(2) : 0}% s/emitidos</span>
                            </div>
                         </div>
                         <div className="bg-rose-500/10 rounded-2xl p-4 flex justify-between items-center border border-rose-500/20">
                            <span className="text-xs font-black uppercase text-rose-400/80 tracking-widest">Votos Nulos</span>
                            <div className="text-right">
                               <span className="font-mono text-xl block leading-none text-rose-400">{votosNulosTotales}</span>
                               <span className="text-[9px] font-black text-rose-400/50 uppercase">{votosEmitidosTotales > 0 ? ((votosNulosTotales/votosEmitidosTotales)*100).toFixed(2) : 0}% s/emitidos</span>
                            </div>
                         </div>
                         <div className="bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-white/5">
                            <span className="text-xs font-black uppercase text-white/50 tracking-widest">Abstención</span>
                            <div className="text-right">
                               <span className="font-mono text-xl block leading-none">{abstencionTotal}</span>
                               <span className="text-[9px] font-black text-white/40 uppercase">{abstencionPct}% s/censo</span>
                            </div>
                         </div>
                     </div>
                </div>

                <h3 className="text-sm font-black uppercase tracking-widest text-white/50 mb-2 mt-8 flex items-center gap-2 px-2"><BarChart className="w-4 h-4 text-blue-400" /> Desglose por Mesas Registradas</h3>
                
                <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#111827]/40 backdrop-blur-sm hidden-scrollbar max-h-[500px]">
                   <table className="w-full text-left text-xs whitespace-nowrap">
                       <thead className="bg-white/5 font-black uppercase tracking-widest text-white/40 sticky top-0 backdrop-blur-xl z-20 shadow-sm border-b border-white/10 text-[9px]">
                           <tr>
                               <th className="px-4 py-3">Mesa Electoral</th>
                               <th className="px-3 py-3 text-center border-l border-white/5">Colegio</th>
                               <th className="px-3 py-3 text-center border-l border-white/5">Censo</th>
                               <th className="px-3 py-3 text-center">Válidos</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                           {mesas.map((m: any) => {
                               const mVotosTotalesCand = votos.filter((v:any) => v.mesa_id === m.id).reduce((acc: number, v:any) => acc + (v.votos_obtenidos || 0), 0);
                               const mVotosValidos = mVotosTotalesCand + (m.votos_blancos || 0);
                               const cType = getColegio(m.id);
                               const cLabel = cType === 'tecnicos' ? 'Técnicos' : cType === 'especialistas' ? 'Especialistas' : 'Único';
                               
                               const cleanName = m.nombre_identificador.replace(/\[TÉCNICOS\]\s*/i, '').replace(/\[ESPECIALISTAS\]\s*/i, '');
     
                               return (
                                   <tr key={m.id} className="hover:bg-white/5 transition-colors">
                                       <td className="px-4 py-3 font-black uppercase text-white truncate max-w-[150px]">{cleanName}</td>
                                       <td className="px-3 py-3 text-center font-bold text-white/40 border-l border-white/5">{cLabel}</td>
                                       <td className="px-3 py-3 text-center font-mono opacity-80 border-l border-white/5">{m.censo_real || 0}</td>
                                       <td className="px-3 py-3 text-center font-black font-mono text-emerald-400 border-l border-white/5 bg-emerald-500/5">{mVotosValidos}</td>
                                   </tr>
                               );
                           })}
                       </tbody>
                   </table>
                </div>

            </div>

        </div>

      </div>

      {/* MODAL BLOQUEAR ELECCION */}
      {showModalBloqueo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#111827] border border-rose-500/30 w-full max-w-lg rounded-[50px] p-12 space-y-8 relative overflow-hidden text-center shadow-[0_0_100px_rgba(225,29,72,0.1)]">
             <div className="absolute top-0 left-0 w-full h-[150px] bg-rose-500/10 blur-[50px] -translate-y-1/2" />
             <div className="relative z-10">
                <Lock className="w-16 h-16 text-rose-500 mx-auto mb-6" />
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-4">
                  ¿ESTÁ SEGURO DE BLOQUEAR ESTA ELECCIÓN?
                </h2>
                <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mb-8 bg-white/5 p-4 rounded-xl border border-white/10">
                  Una vez bloqueada, los interventores no podrán modificar los resultados ni se re-calcularán solas.
                </p>
             </div>
             
             <div className="flex gap-4 relative z-10 w-full">
                <button onClick={() => setShowModalBloqueo(false)} disabled={bloqueando} className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase text-[12px] transition-all text-white disabled:opacity-50">
                  Cancelar
                </button>
                <button 
                  onClick={confirmarBloqueo} 
                  disabled={bloqueando}
                  className="flex-[2] py-5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl uppercase text-[12px] tracking-widest transition-all shadow-[0_10px_40px_rgba(225,29,72,0.3)] hover:shadow-[0_10px_60px_rgba(225,29,72,0.5)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {bloqueando ? <Loader2 className="animate-spin w-5 h-5" /> : 'Guardar y Bloquear'}
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
