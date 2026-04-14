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
  FileDown,
  Mail,
  Phone,
  Contact
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
  const cy = svgH - 20;
  const outerR = 190;
  const innerR = 105;
  const gapRad = data.length > 1 ? 0.025 : 0;

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
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
      `L ${x1i} ${y1i}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
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
            .animate-chart { animation: chartGrow 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

            /* MODO PDF BLANCO (IMPRESIÓN) - CORRECCIÓN LAB/OKLCH */
            .pdf-mode-white {
              background-color: #ffffff !important;
              color: #000000 !important;
            }
            .pdf-mode-white * {
              color: #111827 !important;
              background-color: transparent !important;
              border-color: #e2e8f0 !important;
              background-image: none !important;
              text-shadow: none !important;
              filter: none !important;
              backdrop-filter: none !important;
              transition: none !important;
              animation: none !important;
              box-shadow: none !important;
            }
            .pdf-mode-white div[class*="bg-"], 
            .pdf-mode-white .bg-white\\/5,
            .pdf-mode-white .bg-\\[\\#111827\\]\\/60,
            .pdf-mode-white table, 
            .pdf-mode-white thead,
            .pdf-mode-white tr {
               background-color: #f8fafc !important;
            }
            .pdf-mode-white .text-rose-400 { color: #e11d48 !important; }
            .pdf-mode-white .text-emerald-400 { color: #10b981 !important; }
            .pdf-mode-white .text-amber-400 { color: #f59e0b !important; }
            .pdf-mode-white .text-white\\/30, .pdf-mode-white .text-white\\/40, .pdf-mode-white .text-white\\/50, .pdf-mode-white .text-white\\/70 {
               color: #94a3b8 !important;
            }
            .pdf-mode-white svg text { fill: #000000 !important; }
            .pdf-mode-white [data-html2canvas-ignore="true"] { display: none !important; }
            
            /* Forzar el censo y resultados que usan colores específicos */
            .pdf-mode-white .text-rose-400, .pdf-mode-white .text-red-500 { color: #b91c1c !important; }
            .pdf-mode-white .text-emerald-400, .pdf-mode-white .text-green-500 { color: #15803d !important; }
            .pdf-mode-white .text-amber-400 { color: #b45309 !important; }
            .pdf-mode-white .text-white { color: #000000 !important; }
            .pdf-mode-white h1, .pdf-mode-white h2, .pdf-mode-white h3 { color: #0f172a !important; }
          `}
        </style>
        {sectors.map((s) => (
          <g key={s.i} className="animate-chart" style={{ animationDelay: `${s.i * 50}ms` }}>
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

export default function DetalleEleccionPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [bloqueando, setBloqueando] = useState(false);
  const [datos, setDatos] = useState<any>(null);
  const [showModalBloqueo, setShowModalBloqueo] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);

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
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Error al bloquear la elección.');
    } finally {
       setBloqueando(false);
    }
  };

  const handleDescargarPDF = async () => {
    if (generandoPDF) return;
    setGenerandoPDF(true);

    try {
       const { jsPDF } = await import('jspdf');

       const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
       const W = pdf.internal.pageSize.getWidth();
       const H = pdf.internal.pageSize.getHeight();
       const M = 15; // margen
       let y = M;

       // ── Helpers ──
       const checkPage = (need: number) => {
          if (y + need > H - M) { pdf.addPage(); y = M; }
       };

       const drawLine = () => {
          pdf.setDrawColor(200); pdf.setLineWidth(0.3);
          pdf.line(M, y, W - M, y); y += 4;
       };

       const sectionTitle = (title: string) => {
          checkPage(14);
          pdf.setFillColor(16, 185, 129); // emerald-500
          pdf.rect(M, y, 3, 8, 'F');
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(30, 41, 59);
          pdf.text(title, M + 6, y + 6);
          y += 14;
       };

       const labelValue = (label: string, value: string, xOffset = M) => {
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(120);
          pdf.text(label, xOffset, y);
          y += 4;
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(30, 41, 59);
          pdf.text(value, xOffset, y);
          y += 7;
       };

       // ══════════════════════════════════════════════════════════════
       // CABECERA
       // ══════════════════════════════════════════════════════════════
       pdf.setFillColor(15, 23, 42); // slate-900
       pdf.rect(0, 0, W, 40, 'F');

       pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.setTextColor(255);
       pdf.text('INFORME ELECTORAL CSIF', M, 18);

       pdf.setFontSize(9); pdf.setTextColor(180);
       pdf.text(unidad.nombre.toUpperCase(), M, 27);

       const estadoText = isBloqueada ? 'RESULTADOS BLOQUEADOS' : 'ESCRUTINIO ABIERTO';
       pdf.setFontSize(8);
       const estadoW = pdf.getTextWidth(estadoText) + 8;
       if (isBloqueada) { pdf.setFillColor(59, 130, 246); } else { pdf.setFillColor(16, 185, 129); }
       pdf.roundedRect(W - M - estadoW, 14, estadoW, 7, 2, 2, 'F');
       pdf.setTextColor(255); pdf.setFontSize(7); pdf.setFont('helvetica', 'bold');
       pdf.text(estadoText, W - M - estadoW + 4, 19);

       // Fecha
       pdf.setTextColor(120); pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
       pdf.text(`Generado: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, W - M - estadoW, 30);

       y = 50;

       // ══════════════════════════════════════════════════════════════
       // DATOS DE LA UNIDAD
       // ══════════════════════════════════════════════════════════════
       sectionTitle('DATOS DE LA UNIDAD ELECTORAL');

       const col1 = M; const col2 = M + 50; const col3 = M + 110;
       const savedY = y;
       labelValue('Proceso Electoral', unidad.proceso?.nombre || 'N/A', col1);
       const y1 = y; y = savedY;
       labelValue('Provincia', unidad.provincias?.nombre || 'N/A', col2);
       const y2 = y; y = savedY;
       labelValue('Sector', unidad.sectores?.nombre || 'N/A', col3);
       y = Math.max(y1, y2, y);

       const savedY2 = y;
       labelValue('Censo Total', String(censoTotal), col1);
       const y3 = y; y = savedY2;
       const delTotal = isDoble ? ((unidad.del_tecnicos || 0) + (unidad.del_especialistas || 0)) : (unidad.delegados_a_elegir || 0);
       labelValue('Delegados a Elegir', String(delTotal), col2);
       const y4 = y; y = savedY2;
       if (isDoble) {
          labelValue('Modo Colegio', 'DOBLE COLEGIO', col3);
       } else {
          labelValue('Modo Colegio', 'ÚNICO', col3);
       }
       y = Math.max(y3, y4, y);

       drawLine();

       // ══════════════════════════════════════════════════════════════
       // MÉTRICAS DE PARTICIPACIÓN
       // ══════════════════════════════════════════════════════════════
       sectionTitle('MÉTRICAS DE PARTICIPACIÓN');

       const participacion = censoTotal > 0 ? ((votosEmitidosTotales / censoTotal) * 100).toFixed(2) : '0.00';

       // Fila de métricas
       const metricW = (W - 2 * M) / 4;
       const metrics = [
         { label: 'Participación', value: `${participacion}%` },
         { label: 'Votos Blancos', value: String(votosBlancosTotales) },
         { label: 'Votos Nulos', value: String(votosNulosTotales) },
         { label: `Abstención (${abstencionPct}%)`, value: String(abstencionTotal) },
       ];

       checkPage(20);
       metrics.forEach((m, i) => {
          const mx = M + i * metricW;
          pdf.setFillColor(248, 250, 252);
          pdf.roundedRect(mx + 1, y, metricW - 2, 18, 2, 2, 'F');
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(120);
          pdf.text(m.label, mx + 4, y + 6);
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.setTextColor(30, 41, 59);
          pdf.text(m.value, mx + 4, y + 15);
       });
       y += 25;

       drawLine();

       // ══════════════════════════════════════════════════════════════
       // VOTOS POR CANDIDATURA
       // ══════════════════════════════════════════════════════════════
       sectionTitle('VOTOS POR CANDIDATURA');

       const sindicatosArr = Object.entries(votosPorSindicatoGlobal)
          .sort(([,a]: any, [,b]: any) => b.votos - a.votos);

       // Cabecera de tabla
       checkPage(10);
       pdf.setFillColor(30, 41, 59);
       pdf.rect(M, y, W - 2 * M, 8, 'F');
       pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(255);
       pdf.text('SINDICATO', M + 4, y + 5.5);
       pdf.text('VOTOS', M + 70, y + 5.5);
       pdf.text('% S/TOTAL', M + 100, y + 5.5);
       pdf.text('UMBRAL 5%', M + 135, y + 5.5);
       y += 8;

       const umbral = votosCandidaturasTotales * 0.05;
       sindicatosArr.forEach(([, data]: any, i: number) => {
          checkPage(8);
          if (i % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(M, y, W - 2 * M, 7, 'F'); }
          
          const pct = votosCandidaturasTotales > 0 ? ((data.votos / votosCandidaturasTotales) * 100).toFixed(2) : '0.00';
          const supera = data.votos >= umbral;

          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
          pdf.setTextColor(data.siglas === 'CSIF' ? 16 : 30, data.siglas === 'CSIF' ? 185 : 41, data.siglas === 'CSIF' ? 129 : 59);
          pdf.text(data.siglas, M + 4, y + 5);

          pdf.setTextColor(60); pdf.setFont('helvetica', 'normal');
          pdf.text(String(data.votos), M + 70, y + 5);
          pdf.text(`${pct}%`, M + 100, y + 5);
          
          if (supera) {
             pdf.setTextColor(16, 185, 129); pdf.text('SÍ', M + 140, y + 5);
          } else {
             pdf.setTextColor(220, 38, 38); pdf.text('NO', M + 140, y + 5);
          }
          y += 7;
       });

       // Total
       checkPage(10);
       pdf.setDrawColor(30, 41, 59); pdf.setLineWidth(0.5);
       pdf.line(M, y, W - M, y); y += 2;
       pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(30, 41, 59);
       pdf.text('TOTAL VOTOS A CANDIDATURAS', M + 4, y + 5);
       pdf.text(String(votosCandidaturasTotales), M + 70, y + 5);
       y += 10;

       drawLine();

       // ══════════════════════════════════════════════════════════════
       // REPARTO DE DELEGADOS
       // ══════════════════════════════════════════════════════════════
       sectionTitle('REPARTO DE DELEGADOS');

       if (modoReparto !== 'oficial') {
          checkPage(8);
          pdf.setFont('helvetica', 'italic'); pdf.setFontSize(8);
          pdf.setTextColor(180);
          pdf.text(`Tipo de reparto: ${modoReparto === 'provisional' ? 'PROVISIONAL (ESCRUTINIO ABIERTO)' : 'DEFINITIVO'}`, M, y);
          y += 8;
       }

       // Tabla delegados
       checkPage(10);
       pdf.setFillColor(16, 185, 129);
       pdf.rect(M, y, W - 2 * M, 8, 'F');
       pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(255);
       pdf.text('SINDICATO', M + 4, y + 5.5);
       pdf.text('DELEGADOS', M + 70, y + 5.5);
       pdf.text('DIRECTOS', M + 105, y + 5.5);
       pdf.text('POR RESTO', M + 135, y + 5.5);
       y += 8;

       delegadosARepartirGlobal.forEach((d: any, i: number) => {
          checkPage(8);
          if (i % 2 === 0) { pdf.setFillColor(240, 253, 244); pdf.rect(M, y, W - 2 * M, 7, 'F'); }

          const siglas = d.sindicatos?.siglas || '?';
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10);
          pdf.setTextColor(siglas === 'CSIF' ? 16 : 30, siglas === 'CSIF' ? 185 : 41, siglas === 'CSIF' ? 129 : 59);
          pdf.text(siglas, M + 4, y + 5);

          pdf.setTextColor(30, 41, 59);
          pdf.setFontSize(12);
          pdf.text(String(d.delegados_totales), M + 75, y + 5);

          pdf.setFontSize(9); pdf.setTextColor(100);
          pdf.text(String(d.detalle_reparto?.directos ?? '-'), M + 110, y + 5);
          pdf.text(String(d.detalle_reparto?.restos ?? '-'), M + 140, y + 5);
          y += 7;
       });

       if (delegadosARepartirGlobal.length === 0) {
          checkPage(10);
          pdf.setFont('helvetica', 'italic'); pdf.setFontSize(9); pdf.setTextColor(150);
          pdf.text('Sin datos de reparto disponibles.', M + 4, y + 5);
          y += 10;
       }

       y += 5;
       drawLine();

       // ══════════════════════════════════════════════════════════════
       // DESGLOSE POR MESAS
       // ══════════════════════════════════════════════════════════════
       sectionTitle('DESGLOSE POR MESAS ELECTORALES');

       checkPage(10);
       pdf.setFillColor(30, 41, 59);
       pdf.rect(M, y, W - 2 * M, 8, 'F');
       pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(255);
       pdf.text('MESA ELECTORAL', M + 4, y + 5.5);
       pdf.text('COLEGIO', M + 75, y + 5.5);
       pdf.text('CENSO', M + 110, y + 5.5);
       pdf.text('V. VÁLIDOS', M + 135, y + 5.5);
       pdf.text('ESTADO', M + 160, y + 5.5);
       y += 8;

       mesas.forEach((m: any, i: number) => {
          checkPage(8);
          if (i % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(M, y, W - 2 * M, 7, 'F'); }

          const mVotosCand = votos.filter((v:any) => v.mesa_id === m.id).reduce((acc: number, v:any) => acc + (v.votos_obtenidos || 0), 0);
          const mVotosValidos = mVotosCand + (m.votos_blancos || 0);
          const cType = getColegio(m.id);
          const cLabel = cType === 'tecnicos' ? 'Técnicos' : cType === 'especialistas' ? 'Especialist.' : 'Único';
          const cleanName = m.nombre_identificador.replace(/\[TÉCNICOS\]\s*/i, '').replace(/\[ESPECIALISTAS\]\s*/i, '');
          const enviado = m.fecha_envio ? 'Enviada' : 'Pendiente';

          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(30, 41, 59);
          pdf.text(cleanName.substring(0, 35), M + 4, y + 5);

          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(100);
          pdf.text(cLabel, M + 75, y + 5);
          pdf.text(String(m.censo_real || 0), M + 115, y + 5);

          pdf.setFont('helvetica', 'bold'); pdf.setTextColor(16, 185, 129);
          pdf.text(String(mVotosValidos), M + 140, y + 5);

          pdf.setTextColor(m.fecha_envio ? 16 : 200, m.fecha_envio ? 185 : 100, m.fecha_envio ? 129 : 50);
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7);
          pdf.text(enviado, M + 160, y + 5);
          y += 7;
       });

       // ══════════════════════════════════════════════════════════════
       // PIE DE PÁGINA
       // ══════════════════════════════════════════════════════════════
       const totalPages = pdf.internal.pages.length - 1;
       for (let p = 1; p <= totalPages; p++) {
          pdf.setPage(p);
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(180);
          pdf.text(`CSIF — Informe Electoral Confidencial`, M, H - 7);
          pdf.text(`Página ${p} de ${totalPages}`, W - M - 25, H - 7);
       }

       // Guardar
       const cleanName = datos.unidad.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_");
       pdf.save(`Informe_CSIF_${cleanName}.pdf`);

    } catch (e: any) {
       console.error("Error generando PDF:", e);
       alert("Error al generar el PDF: " + e.message);
    } finally {
       setGenerandoPDF(false);
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

  // ── Datos para el gráfico ──
  let extraColorIdx = 0;
  const chartData = delegadosARepartirGlobal
    .filter((d: any) => d.delegados_totales > 0)
    .map((d: any) => {
      const siglas = d.sindicatos?.siglas || '?';
      const color = getColorSindicato(siglas, extraColorIdx++);
      return { siglas, delegados: d.delegados_totales, color };
    });

  const SindicatosGridBox = ({ arrayDels, compact }: { arrayDels: any[], compact?: boolean }) => {
      if (arrayDels.length === 0) return <div className="p-8 bg-white/5 border border-white/10 rounded-3xl text-center"><p className="text-xs uppercase font-black tracking-widest text-white/40">Sin cálculo disponible</p></div>;
      
      return (
         <div className={`grid ${compact ? 'grid-cols-2 gap-3' : 'grid-cols-2 lg:grid-cols-4 gap-4'}`}>
            {arrayDels.map((c: any) => (
                <div key={c.sindicato_id} className={`group relative ${compact ? 'p-4' : 'p-6'} rounded-3xl border text-center ${c.sindicatos.siglas === 'CSIF' ? 'bg-gradient-to-b from-emerald-500/20 to-emerald-900/40 border-emerald-500/50 hover:border-emerald-500' : 'bg-white/5 border-white/10 hover:border-white/30'} transition-colors cursor-default`}>
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
               <ArrowLeft className="w-4 h-4" /> Panel Nacional
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
                <button 
                  onClick={handleDescargarPDF} 
                  disabled={generandoPDF}
                  className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-sm flex items-center gap-2 text-white disabled:opacity-50"
                >
                   {generandoPDF ? <Loader2 className="w-5 h-5 animate-spin text-emerald-400" /> : <FileDown className="w-5 h-5 text-emerald-400" />}
                   {generandoPDF ? 'Generando Informe...' : 'Informe PDF'}
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
           
           <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Proceso Electoral</p>
                 <p className="text-sm font-bold text-amber-400 uppercase">{unidad.proceso?.nombre || 'NO PROCEDE'}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Año</p>
                 <p className="text-sm font-bold text-rose-400 uppercase">{unidad.anio || '-'}</p>
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

        {/* CARD INTERVENTOR(ES) ASIGNADO(S) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-[#111827]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <Contact className="w-6 h-6 text-emerald-400" />
                 </div>
                 <div>
                   <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] leading-none mb-1">Responsable Asignado</h3>
                   <p className="text-xl font-black uppercase tracking-tight">Intervención de Unidad</p>
                 </div>
              </div>

              {/* Extraer interventores únicos de las mesas */}
              {(() => {
                 const uniqueInterventors = Array.from(new Map(
                   mesas
                     .filter((m: any) => m.interventor)
                     .map((m: any) => [m.interventor.email, m.interventor])
                 ).values());

                 if (uniqueInterventors.length === 0) {
                   return <p className="text-white/20 font-black uppercase text-[10px] tracking-widest text-center py-4 italic">Sin interventor configurado</p>;
                 }

                 return (
                   <div className="space-y-6">
                     {uniqueInterventors.map((int: any, idx: number) => (
                       <div key={idx} className="space-y-4">
                          <p className="text-lg font-black text-white uppercase tracking-tight leading-none">{int.nombre_completo}</p>
                          <div className="flex flex-wrap gap-x-6 gap-y-3">
                             <div className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                                <Mail className="w-4 h-4 text-emerald-500/60" />
                                <span className="text-xs font-medium">{int.email}</span>
                             </div>
                             {int.telefono && (
                               <div className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                                  <Phone className="w-4 h-4 text-emerald-500/60" />
                                  <span className="text-xs font-medium">{int.telefono}</span>
                                </div>
                             )}
                          </div>
                       </div>
                     ))}
                   </div>
                 );
              })()}
           </div>

           {/* Resumen Métrica Acceso Rápido (Lado derecho del interventor) */}
           <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-8 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10 transition-all" />
              <div className="relative z-10 flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Participación Actual</p>
                    <p className="text-5xl font-black text-emerald-400">{censoTotal > 0 ? ((votosEmitidosTotales / censoTotal) * 100).toFixed(1) : 0}%</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Estado de Actas</p>
                    <div className="flex items-center gap-2 justify-end">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="font-black text-sm uppercase text-white">{mesas.length} / {mesas.length} Mesas</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* REPARTO DE DELEGADOS */}
        <div className="mb-10 space-y-6">
           <h3 className={`text-xl font-black uppercase tracking-widest pl-2 border-l-4 ${modoReparto === 'provisional' ? 'border-amber-400 text-amber-400' : 'border-emerald-400 text-white/80'} shadow-sm flex items-center gap-2`}>
              <Target className="w-6 h-6" /> 
              {modoReparto === 'provisional' 
                 ? 'Repartos Provisionales' 
                 : 'REPARTO DEFINITIVO DE DELEGADOS'}
           </h3>

           {/* Gráfico Visual */}
           <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 mb-8 shadow-2xl">
              <div className="text-center mb-8">
                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-2">Visualización de Resultados</h4>
                <p className="text-2xl font-black uppercase tracking-tighter">Reparto Visual de Delegados</p>
              </div>
              <SemicircleChart data={chartData} />
           </div>

           {!isDoble ? (
               <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
                   <h4 className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest mb-4">Comité Total / Junta General</h4>
                   <SindicatosGridBox arrayDels={delegadosARepartirGlobal} />
               </div>
           ) : (
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* GLOBAL DOBLE */}
                  <div className="bg-emerald-900/10 p-6 rounded-3xl border border-emerald-500/20 shadow-inner overflow-hidden relative flex flex-col justify-center">
                      <div className="absolute top-0 right-0 bg-emerald-500/20 px-3 py-1 rounded-bl-xl border-b border-l border-emerald-500/30">
                         <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Suma Agregada</p>
                      </div>
                      <h4 className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest mb-4">Reparto Global (Ambos Colegios)</h4>
                      <SindicatosGridBox arrayDels={delegadosARepartirGlobal} />
                  </div>
                  
                  {/* SUB-COLEGIOS */}
                  <div className="space-y-4">
                      {modoReparto === 'provisional' && (
                         <div className="bg-black/20 p-5 rounded-3xl border border-white/5">
                             <h4 className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-3 flex items-center justify-between">
                                Colegio Técnicos y Administrativos
                                <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white">{unidad.del_tecnicos || 0} Del</span>
                             </h4>
                             <SindicatosGridBox arrayDels={delegadosTecnicos} compact />
                         </div>
                      )}
                      
                      {modoReparto === 'provisional' && (
                         <div className="bg-black/20 p-5 rounded-3xl border border-white/5">
                             <h4 className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-3 flex items-center justify-between">
                                Colegio Especialistas No Cualificados
                                <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white">{unidad.del_especialistas || 0} Del</span>
                             </h4>
                             <SindicatosGridBox arrayDels={delegadosEspecialistas} compact />
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
