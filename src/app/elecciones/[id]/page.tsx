"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Loader2,
  MapPin,
  Building2,
  Users,
  Lock,
  BarChart,
  Target
} from 'lucide-react';

// ── Colores fijos por sindicato ──
const COLORES_SINDICATO: Record<string, string> = {
  'CSIF': '#22c55e',
  'UGT': '#f87171',
  'CCOO': '#e879a0',
  'CGT': '#991b1b',
};

const COLORES_EXTRA = [
  '#60a5fa', '#f59e0b', '#a78bfa', '#2dd4bf', '#fb923c',
  '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#6ee7b7'
];

const getColorSindicato = (siglas: string, idx: number) => {
  const upper = siglas.toUpperCase();
  if (COLORES_SINDICATO[upper]) return COLORES_SINDICATO[upper];
  return COLORES_EXTRA[idx % COLORES_EXTRA.length];
};

// ── Componente Semicírculo SVG (Hemiciclo Parlamentario) ──
const SemicircleChart = ({ data }: { data: { siglas: string; delegados: number; color: string }[] }) => {
  const total = data.reduce((acc, d) => acc + d.delegados, 0);
  if (total === 0) return null;

  const svgW = 440;
  const svgH = 250;
  const cx = svgW / 2;
  const cy = svgH - 20; // Centro en la base
  const outerR = 190;
  const innerR = 105;
  const gapRad = data.length > 1 ? 0.025 : 0; // hueco entre sectores (en radianes)

  // Ángulos en radianes: de π (izquierda) a 0 (derecha), pasando por arriba
  let currentAngle = Math.PI;

  const sectors = data.map((d, i) => {
    const fraction = d.delegados / total;
    const totalSweep = fraction * Math.PI;
    const startAngle = currentAngle - gapRad / 2;
    const endAngle = currentAngle - totalSweep + gapRad / 2;
    currentAngle -= totalSweep;

    const x1o = cx + outerR * Math.cos(startAngle);
    const y1o = cy - outerR * Math.sin(startAngle);
    const x2o = cx + outerR * Math.cos(endAngle);
    const y2o = cy - outerR * Math.sin(endAngle);
    const x1i = cx + innerR * Math.cos(endAngle);
    const y1i = cy - innerR * Math.sin(endAngle);
    const x2i = cx + innerR * Math.cos(startAngle);
    const y2i = cy - innerR * Math.sin(startAngle);

    const sweepDeg = (totalSweep * 180) / Math.PI;
    const largeArc = sweepDeg > 180 ? 1 : 0;

    const path = [
      `M ${x1o} ${y1o}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 0 ${x2o} ${y2o}`,
      `L ${x1i} ${y1i}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 1 ${x2i} ${y2i}`,
      'Z'
    ].join(' ');

    const midAngle = (startAngle + endAngle) / 2;
    const labelR = (outerR + innerR) / 2;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy - labelR * Math.sin(midAngle);

    return { ...d, path, lx, ly, sweepDeg, i };
  });

  return (
    <div className="w-full flex flex-col items-center">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-xl" style={{ overflow: 'visible' }}>
        <style>
          {`
            @keyframes chartGrow {
              from { transform: scale(0.9) translateY(10px); opacity: 0; }
              to { transform: scale(1) translateY(0); opacity: 1; }
            }
            .animate-chart-sector { 
              animation: chartGrow 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              opacity: 0;
            }
          `}
        </style>
        {sectors.map((s) => (
          <g key={s.i} className="animate-chart-sector" style={{ animationDelay: `${s.i * 70}ms` }}>
            <path
              d={s.path}
              fill={s.color}
              stroke="rgba(10,16,31,0.8)"
              strokeWidth="2"
              className="transition-all duration-300 hover:brightness-125 cursor-pointer"
            />
            {s.sweepDeg > 14 && (
              <>
                <text
                  x={s.lx}
                  y={s.ly - 7}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontWeight="900"
                  fontSize="16"
                  className="pointer-events-none drop-shadow-md"
                >
                  {s.delegados}
                </text>
                <text
                  x={s.lx}
                  y={s.ly + 9}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontWeight="700"
                  fontSize="9"
                  opacity="0.75"
                  className="pointer-events-none"
                >
                  {s.siglas}
                </text>
              </>
            )}
          </g>
        ))}
        {/* Total en el centro inferior del arco */}
        <text x={cx} y={cy - 30} textAnchor="middle" fill="white" fontWeight="900" fontSize="36" opacity="0.95">
          {total}
        </text>
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontWeight="800" fontSize="9" opacity="0.35" letterSpacing="3">
          DELEGADOS
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="white" fontWeight="800" fontSize="7" opacity="0.2" letterSpacing="2">
          A REPARTIR
        </text>
      </svg>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 px-4">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full shadow-lg ring-2 ring-white/10" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] font-black text-white/70 uppercase tracking-wider">{d.siglas}: {d.delegados}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DetalleEleccionPublicaPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const resp = await fetch(`/api/admin/visualizar/${id}`);
      if (!resp.ok) throw new Error("Error cargando datos");
      setDatos(await resp.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a101f] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!datos || !datos.unidad) {
    return <div className="min-h-screen bg-[#0a101f] text-white p-12 text-center">Elección no encontrada</div>;
  }

  const { unidad, mesas, votos, consolidados } = datos;

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
    const m = mesas.find((x: any) => x.id === mesaId);
    if (!m) return 'unico';
    if (m.nombre_identificador.toUpperCase().includes('[TÉCNICOS]')) return 'tecnicos';
    if (m.nombre_identificador.toUpperCase().includes('[ESPECIALISTAS]')) return 'especialistas';
    return 'unico';
  };

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

  let modoReparto = "oficial";
  let delegadosARepartirGlobal = [...consolidados];
  let delegadosTecnicos: any[] = [];
  let delegadosEspecialistas: any[] = [];

  const repartirHare = (votosPorSid: any, totalVotosCand: number, numA_Elegir: number) => {
    if (numA_Elegir === 0 || totalVotosCand === 0) return [];
    const umbral = totalVotosCand * 0.05;
    const candidaturasSuperan = Object.entries(votosPorSid).filter(([_, data]: any) => data.votos >= umbral);
    if (candidaturasSuperan.length === 0) return [];

    const cociente = totalVotosCand / numA_Elegir;
    let escanios: Record<string, number> = {};
    let escaniosDirectos: Record<string, number> = {};
    let restos: { sid: string; resto: number }[] = [];
    let repartidos = 0;

    candidaturasSuperan.forEach(([sid, data]: any) => {
      const div = data.votos / cociente;
      const ent = Math.floor(div);
      escanios[sid] = ent;
      escaniosDirectos[sid] = ent;
      repartidos += ent;
      restos.push({ sid, resto: div - ent });
    });

    restos.sort((a, b) => b.resto - a.resto);
    let idx = 0;
    while (repartidos < numA_Elegir && idx < restos.length) {
      escanios[restos[idx].sid]++;
      repartidos++;
      idx++;
    }

    return Object.entries(escanios)
      .filter(([_, esc]) => esc > 0)
      .map(([sid, esc]) => ({
        sindicato_id: sid, delegados_totales: esc,
        sindicatos: { siglas: votosPorSid[sid].siglas },
        detalle_reparto: { directos: escaniosDirectos[sid] || 0, restos: esc - (escaniosDirectos[sid] || 0) }
      })).sort((a, b) => b.delegados_totales - a.delegados_totales);
  };

  if (consolidados.length === 0 && votosCandidaturasTotales > 0) {
    modoReparto = isBloqueada ? "definitivo" : "provisional";

    if (!isDoble) {
      delegadosARepartirGlobal = repartirHare(votosPorSindicatoGlobal, votosCandidaturasTotales, unidad.delegados_a_elegir || 0);
    } else {
      delegadosTecnicos = repartirHare(votosSindicatoTec, votosCandTec, unidad.del_tecnicos || 0);
      delegadosEspecialistas = repartirHare(votosSindicatoEsp, votosCandEsp, unidad.del_especialistas || 0);

      const dGlobalMap: Record<string, any> = {};
      [...delegadosTecnicos, ...delegadosEspecialistas].forEach(d => {
        if (!dGlobalMap[d.sindicato_id]) {
          dGlobalMap[d.sindicato_id] = { ...d, delegados_totales: 0, detalle_reparto: { directos: 0, restos: 0 } };
        }
        dGlobalMap[d.sindicato_id].delegados_totales += d.delegados_totales;
        dGlobalMap[d.sindicato_id].detalle_reparto.directos += d.detalle_reparto.directos;
        dGlobalMap[d.sindicato_id].detalle_reparto.restos += d.detalle_reparto.restos;
      });

      delegadosARepartirGlobal = Object.values(dGlobalMap).sort((a: any, b: any) => b.delegados_totales - a.delegados_totales);
    }
  }

  let extraColorIdx = 0;
  const chartData = delegadosARepartirGlobal
    .filter((d: any) => d.delegados_totales > 0)
    .map((d: any) => {
      const siglas = d.sindicatos?.siglas || '?';
      const color = getColorSindicato(siglas, extraColorIdx++);
      return { siglas, delegados: d.delegados_totales, color };
    });

  // Componente de Grid de Sindicatos
  const SindicatosGridBox = ({ arrayDels, compact }: { arrayDels: any[]; compact?: boolean }) => {
    if (arrayDels.length === 0) return <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center"><p className="text-xs uppercase font-black tracking-widest text-white/40">Sin cálculo disponible</p></div>;
    
    return (
      <div className={`grid ${compact ? 'grid-cols-2 gap-3' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}`}>
        {arrayDels.map((c: any) => (
          <div key={c.sindicato_id} className={`group relative ${compact ? 'p-4' : 'p-5'} rounded-2xl border text-center ${c.sindicatos.siglas === 'CSIF' ? 'bg-gradient-to-b from-emerald-500/20 to-emerald-900/40 border-emerald-500/50 hover:border-emerald-500' : 'bg-white/5 border-white/10 hover:border-white/30'} transition-colors cursor-default`}>
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
              </div>
            )}
            <p className={`${compact ? 'text-base' : 'text-xl'} font-black mb-1 ${c.sindicatos.siglas === 'CSIF' ? 'text-emerald-400' : 'text-white'}`}>{c.sindicatos.siglas}</p>
            <p className={`${compact ? 'text-2xl' : 'text-4xl'} font-black ${c.sindicatos.siglas === 'CSIF' ? 'text-emerald-400' : 'text-white/80'}`}>{c.delegados_totales}</p>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">Delegados</p>
          </div>
        ))}
      </div>
    );
  };

  const VotosList = ({ mapVotos, total, colUmbral }: { mapVotos: any; total: number; colUmbral: number }) => (
    <div className="space-y-3">
      {Object.entries(mapVotos).map(([sid, data]: any) => {
        const noSuperaUmbral = data.votos < colUmbral;
        return (
          <div key={sid} className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className={`font-black uppercase tracking-widest flex items-center gap-2 ${noSuperaUmbral ? 'text-rose-500/80' : data.siglas === 'CSIF' ? 'text-emerald-400' : 'text-white'}`}>
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

  return (
    <div className="min-h-screen bg-[#0a101f] text-white p-4 md:p-8 overflow-hidden relative">
      {/* Fondos decorativos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-10">
        
        {/* ═══ ENCABEZADO ═══ */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
          <div className="space-y-4">
            <Link href="/elecciones" className="inline-flex items-center gap-2 text-white/30 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" /> Volver al listado
            </Link>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mt-4 text-white">
              Dashboard <br /> <span className="text-emerald-400">Electoral</span>
            </h1>
          </div>

          <div className={`px-6 py-4 rounded-2xl border flex items-center gap-3 backdrop-blur-md ${isBloqueada ? 'bg-blue-500/10 border-blue-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
            {isBloqueada ? <Lock className="w-5 h-5 text-blue-400" /> : <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />}
            <div>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isBloqueada ? 'Estado Oficial' : 'Estado del Proceso'}</p>
              <p className={`font-black uppercase tracking-tight ${isBloqueada ? 'text-blue-400' : 'text-emerald-400'}`}>
                {isBloqueada ? 'RESULTADOS OFICIALES' : 'ESCRUTINIO ABIERTO'}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ INFO UNIDAD ═══ */}
        <div className="bg-[#111827]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
          {isDoble && <div className="absolute top-0 right-8 bg-amber-500/20 text-amber-500 font-black text-[10px] px-4 py-1 rounded-b-xl tracking-widest border border-amber-500/30 uppercase border-t-0">Modo Dos Colegios</div>}
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">{unidad.nombre}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Proceso Electoral</p>
              <p className="text-sm font-bold text-amber-400 uppercase">{unidad.proceso?.nombre || 'NO PROCEDE'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Provincia</p>
              <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-white/40" /> <span className="text-sm font-bold text-white uppercase">{unidad.provincias?.nombre || '-'}</span></div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Sector</p>
              <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-white/40" /> <span className="text-sm font-bold text-white uppercase">{unidad.sectores?.nombre || '-'}</span></div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Censo / Delegados</p>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-white">{censoTotal}</span> <span className="text-white/30">|</span>
                <span className="text-xl font-black text-emerald-400 flex items-center gap-1"><Users className="w-4 h-4" /> {isDoble ? ((unidad.del_tecnicos || 0) + (unidad.del_especialistas || 0)) : (unidad.delegados_a_elegir || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ GRÁFICO SEMICÍRCULO (ancho completo, prominente) ═══ */}
        <div className="bg-[#111827]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10">
          <h3 className="text-[11px] font-black text-white/50 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
            <BarChart className="w-4 h-4 text-emerald-400" /> Reparto Visual de Delegados
          </h3>
          {chartData.length > 0 ? (
            <div className="max-w-2xl mx-auto">
              <SemicircleChart data={chartData} />
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-white/30 font-black uppercase text-xs tracking-widest">Pendiente de datos de escrutinio</p>
            </div>
          )}
        </div>

        {/* ═══ REPARTO DE DELEGADOS ═══ */}
        <div className="space-y-6">
          <h3 className={`text-xl font-black uppercase tracking-widest pl-3 border-l-4 ${modoReparto === 'provisional' ? 'border-amber-400 text-amber-400' : 'border-emerald-400 text-white/80'} flex items-center gap-2`}>
            <Target className="w-6 h-6" /> 
            {modoReparto === 'provisional' 
              ? (isDoble ? 'Repartos Provisionales (Cocientes y Restos)' : 'Reparto Provisional Único') 
              : 'REPARTO DEFINITIVO DE DELEGADOS'}
          </h3>

          {!isDoble ? (
            <div className="bg-[#111827]/40 p-6 md:p-8 rounded-3xl border border-white/5">
              <h4 className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest mb-5">Comité Total / Junta General</h4>
              <SindicatosGridBox arrayDels={delegadosARepartirGlobal} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Reparto Global */}
              <div className="bg-emerald-900/10 p-6 md:p-8 rounded-3xl border border-emerald-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500/20 px-3 py-1 rounded-bl-xl border-b border-l border-emerald-500/30">
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Suma Agregada Comité</p>
                </div>
                <h4 className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest mb-5">Reparto Global (Suma de Ambos Colegios)</h4>
                <SindicatosGridBox arrayDels={delegadosARepartirGlobal} />
              </div>

              {/* Sub-colegios lado a lado en escritorio, apilados en móvil */}
              {modoReparto !== 'oficial' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-[#111827]/40 p-6 rounded-3xl border border-white/5">
                    <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-5 flex items-center justify-between">
                      <span>Colegio Técnicos y Administrativos</span>
                      <span className="font-mono bg-white/10 px-3 py-1 rounded-lg text-white text-[11px]">{unidad.del_tecnicos || 0} Delegados</span>
                    </h4>
                    <SindicatosGridBox arrayDels={delegadosTecnicos} compact />
                  </div>
                  <div className="bg-[#111827]/40 p-6 rounded-3xl border border-white/5">
                    <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-5 flex items-center justify-between">
                      <span>Colegio Especialistas No Cualificados</span>
                      <span className="font-mono bg-white/10 px-3 py-1 rounded-lg text-white text-[11px]">{unidad.del_especialistas || 0} Delegados</span>
                    </h4>
                    <SindicatosGridBox arrayDels={delegadosEspecialistas} compact />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══ VOTOS Y MÉTRICAS ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Votos */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
            <h4 className="text-[11px] font-black text-white/50 uppercase tracking-[0.3em] mb-6">Totales de Votos a Candidaturas</h4>
            {!isDoble ? (
              <VotosList mapVotos={votosPorSindicatoGlobal} total={votosCandidaturasTotales} colUmbral={votosCandidaturasTotales * 0.05} />
            ) : (
              <div className="space-y-5">
                <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                  <h5 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Global Sumado</h5>
                  <VotosList mapVotos={votosPorSindicatoGlobal} total={votosCandidaturasTotales} colUmbral={votosCandidaturasTotales * 0.05} />
                </div>
                <div className="bg-black/15 p-4 rounded-2xl border border-white/5">
                  <h5 className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-3">Técnicos y Administrativos</h5>
                  <VotosList mapVotos={votosSindicatoTec} total={votosCandTec} colUmbral={votosCandTec * 0.05} />
                </div>
                <div className="bg-black/15 p-4 rounded-2xl border border-white/5">
                  <h5 className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-3">Especialistas y No C.</h5>
                  <VotosList mapVotos={votosSindicatoEsp} total={votosCandEsp} colUmbral={votosCandEsp * 0.05} />
                </div>
              </div>
            )}
          </div>

          {/* Métricas */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
            <h4 className="text-[11px] font-black text-white/50 uppercase tracking-[0.3em] mb-4">Métricas Globales de la Elección</h4>
            <div className="space-y-3">
              <div className="bg-black/40 rounded-2xl p-4 flex justify-between items-center border border-white/5">
                <span className="text-xs font-black uppercase text-white/50 tracking-widest">Votos Blancos</span>
                <div className="text-right">
                  <span className="font-mono text-xl block leading-none">{votosBlancosTotales}</span>
                  <span className="text-[9px] font-black text-white/30 uppercase">{votosEmitidosTotales > 0 ? ((votosBlancosTotales / votosEmitidosTotales) * 100).toFixed(2) : 0}% s/emitidos</span>
                </div>
              </div>
              <div className="bg-rose-500/10 rounded-2xl p-4 flex justify-between items-center border border-rose-500/20">
                <span className="text-xs font-black uppercase text-rose-400/80 tracking-widest">Votos Nulos</span>
                <div className="text-right">
                  <span className="font-mono text-xl block leading-none text-rose-400">{votosNulosTotales}</span>
                  <span className="text-[9px] font-black text-rose-400/50 uppercase">{votosEmitidosTotales > 0 ? ((votosNulosTotales / votosEmitidosTotales) * 100).toFixed(2) : 0}% s/emitidos</span>
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
        </div>

      </div>
    </div>
  );
}
