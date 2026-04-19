"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft, BarChart3, TrendingUp, Table2, Layers, Award,
  X, Loader2, FileSpreadsheet, FileText, Search, AlertCircle,
  CheckSquare, Square, SlidersHorizontal, Building2, MapPin,
  Calendar, Zap, ChevronDown, Database, Landmark,
} from 'lucide-react';

// ── Paleta de colores de sesión ────────────────────────────────────────────
const SESSION_COLORS = [
  '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6',
  '#ef4444', '#14b8a6', '#f97316',
];

// ── Tipos ─────────────────────────────────────────────────────────────────
interface Unidad {
  id: string;
  nombre: string;
  anio?: number;
  estado?: string;
  delegados_a_elegir?: number;
  provincias?: { nombre: string };
  sectores?: { nombre: string };
  tipos_organos?: { nombre: string };
}

interface SindicatoData { siglas: string; nombre: string; delegados: number; }
interface UnidadAnalizada {
  id: string;
  nombre: string;
  anio: number;
  estado: string;
  delegadosAElegir: number;
  totalDelegadosObtenidos: number;
  provincia: string | null;
  sector: string | null;
  tipoOrgano: string | null;
  sindicatos: SindicatoData[];
}

const VISTAS = [
  { key: 'comparativa', label: 'Comparativa', icon: BarChart3 },
  { key: 'tabla',       label: 'Tabla Cruzada', icon: Table2 },
  { key: 'evolucion',   label: 'Evolución', icon: TrendingUp },
  { key: 'sector',      label: 'Por Sector', icon: Layers },
  { key: 'representatividad', label: 'Represent.', icon: Award },
] as const;
type VistaKey = typeof VISTAS[number]['key'];

// ── Tooltip ────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a101f] border border-white/10 rounded-2xl p-4 shadow-2xl max-w-xs">
      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 truncate">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-sm font-bold">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-white/60 truncate max-w-[160px]">{p.name}:</span>
          <span className="text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── FilterDropdown ─────────────────────────────────────────────────────────
function FilterDropdown({
  label, icon, options, selected, onToggle, accentColor = 'amber',
}: {
  label: string;
  icon: React.ReactNode;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  accentColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const accent = accentColor === 'amber'
    ? { pill: 'bg-amber-500/15 border-amber-500/40 text-amber-300', item: 'bg-amber-500/20 text-amber-300 border-amber-500/20', check: 'bg-amber-500 border-amber-500', count: 'bg-amber-500/30 text-amber-300' }
    : { pill: 'bg-white/10 border-white/20 text-white', item: 'bg-white/10 text-white border-white/20', check: 'bg-white border-white', count: 'bg-white/20 text-white' };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
          selected.length > 0 ? accent.pill : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
        }`}
      >
        {icon}
        {label}
        {selected.length > 0 && (
          <span className={`rounded-full w-4 h-4 flex items-center justify-center text-[8px] ${accent.count}`}>
            {selected.length}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && options.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-50 bg-[#0d1526] border border-white/10 rounded-2xl shadow-2xl min-w-[200px] max-h-56 overflow-y-auto">
            <div className="p-1.5 space-y-0.5">
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={() => { onToggle(opt); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all text-[11px] font-bold uppercase tracking-wide border ${
                    selected.includes(opt) ? accent.item : 'border-transparent text-white/50 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                    selected.includes(opt) ? accent.check : 'border-white/20'
                  }`}>
                    {selected.includes(opt) && <X className="w-2.5 h-2.5 text-[#0a101f]" />}
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function InformesPage() {
  const [todasUnidades, setTodasUnidades] = useState<Unidad[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [sesion, setSesion] = useState<string[]>([]);
  const [datos, setDatos] = useState<UnidadAnalizada[]>([]);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const [vista, setVista] = useState<VistaKey>('comparativa');
  const [exportando, setExportando] = useState(false);
  const [exportandoPDF, setExportandoPDF] = useState(false);

  // ── Filtros panel izquierdo ──────────────────────────────────────────────
  const [search, setSearch]               = useState('');
  const [filterAnios, setFilterAnios]     = useState<string[]>([]);
  const [filterProvs, setFilterProvs]     = useState<string[]>([]);
  const [filterSects, setFilterSects]     = useState<string[]>([]);
  const [filterOrganos, setFilterOrganos] = useState<string[]>([]);
  const [filterUnidades, setFilterUnidades] = useState<string[]>([]);

  // ── Carga inicial de unidades ────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/unidades');
        const data = await res.json();
        if (Array.isArray(data)) {
          // Mismos estados que el visualizador
          const relevantes = ['activa', 'escrutinio', 'finalizada', 'congelada'];
          setTodasUnidades(data.filter((u: Unidad) => relevantes.includes(u.estado || '')));
        }
      } catch (e) {
        console.error('Error cargando unidades', e);
      } finally {
        setLoadingUnidades(false);
      }
    };
    load();
  }, []);

  // ── Opciones de filtro (derivadas de la lista) ───────────────────────────
  const optAnios    = [...new Set(todasUnidades.map(u => String(u.anio)).filter(v => v && v !== 'undefined' && v !== 'null'))].sort().reverse();
  const optProvs    = [...new Set(todasUnidades.map(u => u.provincias?.nombre).filter(Boolean) as string[])].sort();
  const optSects    = [...new Set(todasUnidades.map(u => u.sectores?.nombre).filter(Boolean) as string[])].sort();
  const optOrganos  = [...new Set(todasUnidades.map(u => u.tipos_organos?.nombre).filter(Boolean) as string[])].sort();
  const optUnidades = [...new Set(todasUnidades.map(u => u.nombre).filter(Boolean))].sort();

  const toggleFilter = (set: React.Dispatch<React.SetStateAction<string[]>>, val: string) =>
    set(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const hasFilters = filterAnios.length > 0 || filterProvs.length > 0 || filterSects.length > 0 || filterOrganos.length > 0 || filterUnidades.length > 0 || search !== '';
  const clearFilters = () => { setFilterAnios([]); setFilterProvs([]); setFilterSects([]); setFilterOrganos([]); setFilterUnidades([]); setSearch(''); };

  // ── Unidades filtradas ───────────────────────────────────────────────────
  const unidadesFiltradas = todasUnidades.filter(u => {
    if (search) {
      const term = search.toUpperCase();
      const matchN = u.nombre.toUpperCase().includes(term);
      const matchP = (u.provincias?.nombre || '').toUpperCase().includes(term);
      if (!matchN && !matchP) return false;
    }
    if (filterAnios.length > 0 && !filterAnios.includes(String(u.anio))) return false;
    if (filterProvs.length > 0 && !filterProvs.includes(u.provincias?.nombre || '')) return false;
    if (filterSects.length > 0 && !filterSects.includes(u.sectores?.nombre || '')) return false;
    if (filterOrganos.length > 0 && !filterOrganos.includes(u.tipos_organos?.nombre || '')) return false;
    if (filterUnidades.length > 0 && !filterUnidades.includes(u.nombre)) return false;
    return true;
  });

  // ── Carga de datos analíticos ────────────────────────────────────────────
  const cargarDatos = useCallback(async (ids: string[]) => {
    if (ids.length === 0) { setDatos([]); return; }
    setLoadingDatos(true);
    try {
      const res = await fetch(`/api/admin/informes/datos?ids=${ids.join(',')}`);
      const data = await res.json();
      if (Array.isArray(data)) setDatos(data);
    } catch (e) {
      console.error('Error cargando datos de informes', e);
    } finally {
      setLoadingDatos(false);
    }
  }, []);

  useEffect(() => { cargarDatos(sesion); }, [sesion, cargarDatos]);

  const toggleUnidad = (id: string) => {
    setSesion(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 9) return prev;
      return [...prev, id];
    });
  };

  // ── Exportar Excel ───────────────────────────────────────────────────────
  const exportarExcel = async () => {
    if (sesion.length === 0) return;
    setExportando(true);
    try {
      const res = await fetch(`/api/admin/informes/excel?ids=${sesion.join(',')}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe_comparativo_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error exportando', e);
    } finally {
      setExportando(false);
    }
  };

  // ── Exportar PDF ─────────────────────────────────────────────────────────
  const exportarPDF = async () => {
    if (datos.length === 0) return;
    setExportandoPDF(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();
      const M = 15; // margen
      let y = M;

      const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

      // ── Helpers ──────────────────────────────────────────────────────
      const ensureSpace = (need: number) => { if (y + need > H - M) { pdf.addPage(); y = M; } };
      const section = (title: string) => {
        ensureSpace(18);
        pdf.setDrawColor(200); pdf.setLineWidth(0.3); pdf.line(M, y, W - M, y); y += 5;
        pdf.setFillColor(16, 185, 129);
        pdf.rect(M, y, 3, 7, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(30, 41, 59);
        pdf.text(title, M + 6, y + 5.5);
        y += 13;
      };
      const kv = (label: string, value: string, x: number) => {
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(120);
        pdf.text(label, x, y);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(30, 41, 59);
        pdf.text(value, x, y + 4.5);
      };

      // ── PORTADA / HEADER ──────────────────────────────────────────────
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, W, 35, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16); pdf.setTextColor(255);
      pdf.text('INFORME COMPARATIVO — ELECCIONES SINDICALES', M, 16);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(180);
      pdf.text(`Mission Control · ${fecha} · ${datos.length} elección${datos.length !== 1 ? 'es' : ''} analizadas`, M, 24);
      y = 45;

      // ── KPIs ──────────────────────────────────────────────────────────
      section('Resumen General');
      const totalDel = datos.reduce((s, u) => s + u.totalDelegadosObtenidos, 0);
      const totalEleg = datos.reduce((s, u) => s + u.delegadosAElegir, 0);
      const allSinds = new Set<string>(); datos.forEach(u => u.sindicatos.forEach(s => allSinds.add(s.siglas)));
      const spacing = (W - 2 * M) / 4;
      kv('Total Delegados Obtenidos', totalDel.toLocaleString('es-ES'), M);
      kv('Elecciones Analizadas', String(datos.length), M + spacing);
      kv('Total a Elegir', totalEleg.toLocaleString('es-ES'), M + spacing * 2);
      kv('Sindicatos Distintos', String(allSinds.size), M + spacing * 3);
      y += 12;

      // ── FICHA POR ELECCIÓN ────────────────────────────────────────────
      section('Detalle por Elección');
      datos.forEach((u, idx) => {
        ensureSpace(40);
        // Cabecera de la elección
        const colorHex = SESSION_COLORS[idx] || '#888';
        const r = parseInt(colorHex.slice(1, 3), 16);
        const g = parseInt(colorHex.slice(3, 5), 16);
        const b = parseInt(colorHex.slice(5, 7), 16);
        pdf.setFillColor(r, g, b);
        pdf.rect(M, y, W - 2 * M, 8, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(255);
        pdf.text(`${u.nombre}`, M + 3, y + 5.5);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
        const meta = [u.anio, u.provincia, u.sector, u.tipoOrgano].filter(Boolean).join(' · ');
        pdf.text(meta, W - M - pdf.getTextWidth(meta) - 3, y + 5.5);
        y += 12;

        // KVs de la elección
        kv('Delegados Obtenidos', String(u.totalDelegadosObtenidos), M);
        kv('Delegados a Elegir', String(u.delegadosAElegir), M + 60);
        kv('Estado', u.estado?.toUpperCase() || '—', M + 120);
        y += 12;

        // Tabla de sindicatos
        if (u.sindicatos.length > 0) {
          ensureSpace(10 + u.sindicatos.length * 5.5);
          // Headers
          pdf.setFillColor(240, 240, 240);
          pdf.rect(M, y, W - 2 * M, 6, 'F');
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(80);
          pdf.text('SINDICATO', M + 2, y + 4.2);
          pdf.text('NOMBRE COMPLETO', M + 35, y + 4.2);
          pdf.text('DELEGADOS', W - M - 45, y + 4.2);
          pdf.text('% REPR.', W - M - 18, y + 4.2);
          y += 7;

          u.sindicatos.forEach((s, si) => {
            ensureSpace(6);
            if (si % 2 === 0) { pdf.setFillColor(248, 248, 248); pdf.rect(M, y - 1, W - 2 * M, 5.5, 'F'); }
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(30, 41, 59);
            pdf.text(s.siglas, M + 2, y + 3);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(80);
            const nombreTrunc = s.nombre.length > 50 ? s.nombre.slice(0, 47) + '...' : s.nombre;
            pdf.text(nombreTrunc, M + 35, y + 3);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(30, 41, 59);
            pdf.text(String(s.delegados), W - M - 45, y + 3);
            const pct = u.totalDelegadosObtenidos > 0 ? ((s.delegados / u.totalDelegadosObtenidos) * 100).toFixed(1) + '%' : '—';
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(100);
            pdf.text(pct, W - M - 18, y + 3);
            y += 5.5;
          });
          // Total row
          pdf.setDrawColor(180); pdf.setLineWidth(0.2); pdf.line(M, y, W - M, y); y += 1;
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(30, 41, 59);
          pdf.text('TOTAL', M + 2, y + 3.5);
          pdf.text(String(u.totalDelegadosObtenidos), W - M - 45, y + 3.5);
          pdf.text('100%', W - M - 18, y + 3.5);
          y += 8;
        }
        y += 5;
      });

      // ── TABLA CRUZADA ─────────────────────────────────────────────────
      if (datos.length >= 2) {
        pdf.addPage();
        y = M;
        section('Tabla Cruzada: Sindicatos × Elecciones');

        // Recolectar todos los sindicatos
        const sindMap: Record<string, number> = {};
        datos.forEach(u => u.sindicatos.forEach(s => { sindMap[s.siglas] = (sindMap[s.siglas] || 0) + s.delegados; }));
        const allSindsCruz = Object.entries(sindMap).sort((a, b) => b[1] - a[1]);

        // Calcular ancho de columnas
        const colSind = 25;
        const colTotal = 22;
        const availW = W - 2 * M - colSind - colTotal;
        const colElec = Math.min(availW / datos.length, 45);

        ensureSpace(8);
        // Header
        pdf.setFillColor(15, 23, 42);
        pdf.rect(M, y, W - 2 * M, 7, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(255);
        pdf.text('SINDICATO', M + 2, y + 4.8);
        datos.forEach((u, i) => {
          const lbl = `${u.provincia || 'S/P'} (${u.anio})`;
          pdf.text(lbl, M + colSind + i * colElec + 2, y + 4.8);
        });
        pdf.text('TOTAL', M + colSind + datos.length * colElec + 2, y + 4.8);
        y += 9;

        // Rows
        allSindsCruz.forEach(([siglas, total], ri) => {
          ensureSpace(6);
          if (ri % 2 === 0) { pdf.setFillColor(245, 245, 245); pdf.rect(M, y - 1, W - 2 * M, 5.5, 'F'); }
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(30, 41, 59);
          pdf.text(siglas, M + 2, y + 3);
          datos.forEach((u, i) => {
            const found = u.sindicatos.find(s => s.siglas === siglas);
            const val = found?.delegados || 0;
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(val > 0 ? 30 : 180, val > 0 ? 41 : 180, val > 0 ? 59 : 180);
            pdf.text(val > 0 ? String(val) : '—', M + colSind + i * colElec + 2, y + 3);
          });
          pdf.setFont('helvetica', 'bold'); pdf.setTextColor(16, 185, 129);
          pdf.text(String(total), M + colSind + datos.length * colElec + 2, y + 3);
          y += 5.5;
        });
      }

      // ── REPRESENTATIVIDAD ────────────────────────────────────────────
      if (todosSindicatos.length > 0) {
        ensureSpace(30);
        y += 5;
        section('Índice de Representatividad — Acumulado');
        todosSindicatos.forEach(({ siglas, total }) => {
          ensureSpace(6);
          const pct = totalDelegados > 0 ? (total / totalDelegados) * 100 : 0;
          const tag = pct >= 15 ? '≥15% ALTA' : pct >= 10 ? '≥10% MEDIA' : '< 10%';
          if (pct >= 15) { pdf.setTextColor(16, 185, 129); } else if (pct >= 10) { pdf.setTextColor(245, 158, 11); } else { pdf.setTextColor(150); }
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
          pdf.text(`${siglas}`, M + 2, y + 3);
          pdf.text(`${total} del.`, M + 30, y + 3);
          pdf.text(`${pct.toFixed(1)}%`, M + 55, y + 3);
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7);
          pdf.text(tag, M + 75, y + 3);
          y += 5.5;
        });
      }

      // ── PÁGINAS DE GRÁFICOS ──────────────────────────────────────────────
      try {
        const html2canvas = (await import('html2canvas')).default;
        const captureChart = async (id: string): Promise<string | null> => {
          const el = document.getElementById(id);
          if (!el) return null;
          const originalClass = el.className;
          // Movemos el gráfico temporalmente a la pantalla (detrás del contenido) para evitar el culling del navegador
          el.className = 'absolute top-0 left-0 w-[900px] z-[0] pointer-events-none';
          try {
            await new Promise(r => setTimeout(r, 100)); // tiempo para ResizeObserver de Recharts
            const canvas = await html2canvas(el as HTMLElement, {
              backgroundColor: '#0a101f',
              scale: 1.5,
              logging: false,
              useCORS: true,
            });
            el.className = originalClass;
            return canvas.toDataURL('image/png');
          } catch { 
            el.className = originalClass;
            return null; 
          }
        };

        const [imgComp, imgEvol, imgSect, imgRepr] = await Promise.all([
          captureChart('pdf-chart-comparativa'),
          captureChart('pdf-chart-evolucion'),
          captureChart('pdf-chart-sector'),
          captureChart('pdf-chart-representatividad'),
        ]);

        const graficos = [
          { img: imgComp, title: 'Comparativa de Delegados por Sindicato' },
          { img: imgEvol, title: 'Evolución Temporal por Sindicato (Top 6)' },
          { img: imgSect, title: 'Distribución por Sector Económico' },
          { img: imgRepr, title: 'Índice de Representatividad' },
        ].filter(c => c.img);

        if (graficos.length > 0) {
          pdf.addPage();
          y = M;
          section('Gráficos y Visualizaciones');
          pdf.setFont('helvetica', 'italic'); pdf.setFontSize(7); pdf.setTextColor(150);
          pdf.text('Captura de los gráficos interactivos de la sesión de análisis', M, y - 6);

          for (const { img, title } of graficos) {
            if (!img) continue;
            // Calcular dimensiones manteniendo aspect ratio
            const tmpImg = new Image();
            await new Promise<void>(res => { tmpImg.onload = () => res(); tmpImg.src = img; });
            const ratio = tmpImg.naturalHeight / tmpImg.naturalWidth;
            const imgW = W - 2 * M;
            const imgH = Math.min(imgW * ratio, 90);

            ensureSpace(imgH + 18);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(50, 50, 50);
            pdf.text(title, M, y + 4); y += 8;
            pdf.addImage(img, 'PNG', M, y, imgW, imgH);
            y += imgH + 10;
          }
        }
      } catch (chartErr) {
        console.warn('Chart capture error (PDF sin gráficos):', chartErr);
      }

      // ── PIE DE PÁGINA EN TODAS LAS PÁGINAS ───────────────────────────
      const totalPages = pdf.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(180);
        pdf.text(`Informe generado por Mission Control — ${fecha}`, M, H - 6);
        pdf.text(`Página ${p} de ${totalPages}`, W - M - 25, H - 6);
      }

      pdf.save(`informe_comparativo_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error('Error generando PDF', e);
    } finally {
      setExportandoPDF(false);
    }
  };

  // ── Datos derivados para gráficos ────────────────────────────────────────
  const todosSindicatos = (() => {
    const map: Record<string, number> = {};
    datos.forEach(u => u.sindicatos.forEach(s => { map[s.siglas] = (map[s.siglas] || 0) + s.delegados; }));
    return Object.entries(map).map(([siglas, total]) => ({ siglas, total })).sort((a, b) => b.total - a.total);
  })();

  const totalDelegados   = datos.reduce((s, u) => s + u.totalDelegadosObtenidos, 0);
  const sindicatosTop6   = todosSindicatos.slice(0, 6);

  // Comparativa (eje X = sindicato, una barra por unidad)
  const dataComparativa = todosSindicatos.slice(0, 15).map(({ siglas }) => {
    const entry: Record<string, any> = { sindicato: siglas };
    datos.forEach((u, i) => {
      const found = u.sindicatos.find(s => s.siglas === siglas);
      entry[`u${i}`] = found?.delegados || 0;
    });
    return entry;
  });

  // Evolución (eje X = elección ordenada por año)
  const datosOrdenados = [...datos].sort((a, b) => (a.anio || 0) - (b.anio || 0));
  const dataEvolucion = datosOrdenados.map(u => {
    const entry: Record<string, any> = { label: `${u.provincia || 'S/P'} (${u.anio})` };
    sindicatosTop6.forEach(s => {
      const found = u.sindicatos.find(x => x.siglas === s.siglas);
      entry[s.siglas] = found?.delegados || 0;
    });
    return entry;
  });

  // Por sector (agrupa delegados de todas las unidades por sector)
  const sectorMap: Record<string, Record<string, number>> = {};
  datos.forEach((u, i) => {
    const sector = u.sector || 'Sin sector';
    if (!sectorMap[sector]) sectorMap[sector] = {};
    sectorMap[sector][`u${i}`] = (sectorMap[sector][`u${i}`] || 0) + u.totalDelegadosObtenidos;
  });
  const dataSector = Object.entries(sectorMap).map(([sector, vals]) => ({ sector: sector.slice(0, 25), ...vals }));

  // Representatividad acumulada
  const dataRepresentatividad = todosSindicatos.map(({ siglas, total }) => ({
    siglas,
    total,
    pct: totalDelegados > 0 ? (total / totalDelegados) * 100 : 0,
  }));

  // ── Label helpers ─────────────────────────────────────────────────────────
  const labelUnidad = (i: number) => datos[i] ? `${datos[i].provincia || 'S/P'} (${datos[i].anio})` : `u${i}`;

  // ── Estado badge ──────────────────────────────────────────────────────────
  const estadoBadge = (estado?: string) => {
    if (estado === 'congelada') return <span className="text-[8px] font-black text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-md">Oficial</span>;
    if (estado === 'finalizada') return <span className="text-[8px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-md">Finalizada</span>;
    if (estado === 'activa') return <span className="text-[8px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-md flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />Activa</span>;
    if (estado === 'escrutinio') return <span className="text-[8px] font-black text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded-md">Escrutinio</span>;
    return null;
  };

  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#050c18] text-white flex flex-col" style={{ height: '100dvh' }}>

      {/* HEADER */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a101f]/90 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/admin/nacional/dashboard" className="group p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 text-white/30 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-amber-400/60">Módulo de Análisis</p>
            <h1 className="text-base font-black uppercase tracking-widest leading-none">
              MÓDULO DE ANÁLISIS <span className="text-amber-400">·</span> INFORMES
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {sesion.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              {sesion.map((id, i) => (
                <div
                  key={id}
                  className="w-2.5 h-2.5 rounded-full border-2 border-[#050c18]"
                  style={{ backgroundColor: SESSION_COLORS[i] }}
                  title={todasUnidades.find(u => u.id === id)?.nombre}
                />
              ))}
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">{sesion.length}/9</span>
            </div>
          )}
          <button
            onClick={exportarPDF}
            disabled={datos.length === 0 || exportandoPDF}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {exportandoPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            PDF
          </button>
          <button
            onClick={exportarExcel}
            disabled={sesion.length === 0 || exportando}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {exportando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            Excel
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── PANEL IZQUIERDO ────────────────────────────────────────────── */}
        <aside className="w-72 shrink-0 border-r border-white/5 bg-[#080f1e] flex flex-col overflow-hidden">

          {/* Cabecera del panel */}
          <div className="p-4 border-b border-white/5 space-y-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400/50" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Selector de Sesión</span>
            </div>

            {/* Búsqueda libre */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
              <input
                type="text"
                placeholder="Buscar por nombre / provincia..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-[11px] font-bold placeholder:text-white/20 focus:outline-none focus:border-amber-500/40 transition-all"
              />
            </div>

            {/* Filtros dropdown (mismos que el visualizador) */}
            <div className="flex flex-wrap gap-1.5">
              <FilterDropdown
                label="Año"
                icon={<Calendar className="w-3 h-3" />}
                options={optAnios}
                selected={filterAnios}
                onToggle={v => toggleFilter(setFilterAnios, v)}
              />
              <FilterDropdown
                label="Provincia"
                icon={<MapPin className="w-3 h-3" />}
                options={optProvs}
                selected={filterProvs}
                onToggle={v => toggleFilter(setFilterProvs, v)}
              />
              <FilterDropdown
                label="Sector"
                icon={<Building2 className="w-3 h-3" />}
                options={optSects}
                selected={filterSects}
                onToggle={v => toggleFilter(setFilterSects, v)}
              />
              <FilterDropdown
                label="Órgano"
                icon={<Layers className="w-3 h-3" />}
                options={optOrganos}
                selected={filterOrganos}
                onToggle={v => toggleFilter(setFilterOrganos, v)}
              />
              <FilterDropdown
                label="Unidad"
                icon={<Landmark className="w-3 h-3" />}
                options={optUnidades}
                selected={filterUnidades}
                onToggle={v => toggleFilter(setFilterUnidades, v)}
              />
            </div>

            {/* Tags activos + limpiar */}
            {hasFilters && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
                  {unidadesFiltradas.length} resultado{unidadesFiltradas.length !== 1 ? 's' : ''}
                </span>
                <button onClick={clearFilters} className="flex items-center gap-1 text-[9px] font-black text-white/30 hover:text-amber-400 transition-colors uppercase tracking-widest">
                  <X className="w-3 h-3" /> Limpiar
                </button>
              </div>
            )}
          </div>

          {/* Lista de unidades */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {loadingUnidades ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-amber-400/50 animate-spin" />
              </div>
            ) : unidadesFiltradas.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Database className="w-8 h-8 text-white/10 mx-auto" />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Sin elecciones</p>
                {hasFilters && (
                  <p className="text-[9px] text-white/15 font-bold">Prueba a limpiar los filtros</p>
                )}
              </div>
            ) : (
              unidadesFiltradas.map(u => {
                const idx = sesion.indexOf(u.id);
                const isSelected = idx !== -1;
                const color = isSelected ? SESSION_COLORS[idx] : null;
                const maxReached = sesion.length >= 9 && !isSelected;

                return (
                  <button
                    key={u.id}
                    onClick={() => toggleUnidad(u.id)}
                    disabled={maxReached}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all border ${
                      isSelected
                        ? 'bg-white/5 border-white/10'
                        : 'border-transparent hover:bg-white/[0.04] hover:border-white/5 text-white/50'
                    } ${maxReached ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 shrink-0 mt-0.5" style={{ color: color! }} />
                    ) : (
                      <Square className="w-4 h-4 shrink-0 mt-0.5 text-white/20" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] font-black uppercase leading-tight truncate ${isSelected ? 'text-white' : ''}`}>
                        {u.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {u.anio && (
                          <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{u.anio}</span>
                        )}
                        {u.provincias?.nombre && (
                          <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest truncate max-w-[80px]">
                            {u.provincias.nombre}
                          </span>
                        )}
                        {estadoBadge(u.estado)}
                      </div>
                    </div>
                    {isSelected && color && (
                      <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: color }} />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer del panel */}
          <div className="shrink-0 border-t border-white/5 p-3 space-y-2">
            {sesion.length >= 9 && (
              <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-wide">Máximo 9 procesos</p>
              </div>
            )}
            {sesion.length > 0 && (
              <button
                onClick={() => setSesion([])}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/10 text-white/30 hover:text-white hover:border-white/20 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <X className="w-3 h-3" /> Limpiar sesión ({sesion.length}/9)
              </button>
            )}
            {!loadingUnidades && (
              <p className="text-center text-[9px] font-bold text-white/15 uppercase tracking-widest">
                {todasUnidades.length} elecciones disponibles
              </p>
            )}
          </div>
        </aside>

        {/* ── ÁREA PRINCIPAL ──────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {sesion.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
              <div className="relative">
                <div className="w-20 h-20 bg-amber-500/5 border border-amber-500/10 rounded-[30px] flex items-center justify-center">
                  <BarChart3 className="w-10 h-10 text-amber-500/20" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500/20 rounded-full border border-amber-500/30 flex items-center justify-center">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                </div>
              </div>
              <div className="text-center max-w-sm">
                <h2 className="text-xl font-black uppercase tracking-tight text-white/30">Selecciona elecciones</h2>
                <p className="text-[11px] font-bold text-white/15 uppercase tracking-widest mt-2">
                  Usa el panel izquierdo para seleccionar hasta 9 elecciones a comparar
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center max-w-[200px]">
                {SESSION_COLORS.map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-full opacity-30" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          ) : loadingDatos ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Cargando análisis...</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-5">

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Delegados Obtenidos', value: totalDelegados.toLocaleString('es-ES'), color: 'text-amber-400', border: 'border-amber-500/20 bg-amber-500/[0.04]' },
                  { label: 'Elecciones en Sesión', value: datos.length, color: 'text-indigo-400', border: 'border-indigo-500/20 bg-indigo-500/[0.04]' },
                  { label: 'Total a Elegir', value: datos.reduce((s, u) => s + u.delegadosAElegir, 0).toLocaleString('es-ES'), color: 'text-emerald-400', border: 'border-emerald-500/20 bg-emerald-500/[0.04]' },
                  { label: 'Sindicatos Distintos', value: todosSindicatos.length, color: 'text-pink-400', border: 'border-pink-500/20 bg-pink-500/[0.04]' },
                ].map(kpi => (
                  <div key={kpi.label} className={`border ${kpi.border} rounded-2xl p-4`}>
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.25em] mb-1.5">{kpi.label}</p>
                    <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              {/* Chips de sesión */}
              <div className="flex flex-wrap gap-1.5">
                {sesion.map((id, i) => {
                  const u = todasUnidades.find(x => x.id === id);
                  return u ? (
                    <div
                      key={id}
                      className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest"
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SESSION_COLORS[i] }} />
                      <span className="text-white/70 max-w-[150px] truncate">{u.nombre}</span>
                      {u.anio && <span className="text-white/30">{u.anio}</span>}
                      <button
                        onClick={() => toggleUnidad(id)}
                        className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all ml-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>

              {/* Tabs de vista */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {VISTAS.map(v => {
                  const Icon = v.icon;
                  const active = vista === v.key;
                  return (
                    <button
                      key={v.key}
                      onClick={() => setVista(v.key)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                        active
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {v.label}
                    </button>
                  );
                })}
              </div>

              {/* ── VISTAS ─────────────────────────────────────────────── */}

              <div id="pdf-chart-comparativa" className={vista !== 'comparativa' ? 'fixed -left-[10000px] top-0 w-[900px] -z-50 overflow-hidden' : ''}>
                <ChartCard title="Delegados por Sindicato — Comparativa entre Elecciones">
                  {dataComparativa.length === 0 ? <EmptyChart msg="Sin resultados consolidados en las elecciones seleccionadas" /> : (
                    <ResponsiveContainer width="100%" height={360}>
                      <BarChart data={dataComparativa} margin={{ top: 10, right: 20, left: -10, bottom: 85 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                        <XAxis dataKey="sindicato" tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 700 }} angle={-40} textAnchor="end" interval={0} height={80} />
                        <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 12 }} />
                        {datos.map((_, i) => (
                          <Bar isAnimationActive={false} key={i} dataKey={`u${i}`} name={labelUnidad(i)} fill={SESSION_COLORS[i]} radius={[4, 4, 0, 0]} maxBarSize={40} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>

              {vista === 'tabla' && (
                <ChartCard title="Tabla Cruzada: Sindicatos × Elecciones">
                  {todosSindicatos.length === 0 ? <EmptyChart msg="Sin resultados consolidados" /> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left py-3 pr-4 font-black text-white/30 uppercase tracking-widest text-[9px] w-20 shrink-0">Sindicato</th>
                            {datos.map((u, i) => (
                              <th key={u.id} className="text-right py-3 px-3 font-black text-[9px] uppercase tracking-widest min-w-[130px]" style={{ color: SESSION_COLORS[i] + 'cc' }}>
                                <div className="max-w-[150px] truncate">{u.nombre}</div>
                                <div className="text-white/30 font-bold">{u.anio}</div>
                              </th>
                            ))}
                            <th className="text-right py-3 pl-4 font-black text-white/30 uppercase tracking-widest text-[9px]">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todosSindicatos.map(({ siglas, total }) => (
                            <tr key={siglas} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                              <td className="py-3 pr-4 font-black text-white">{siglas}</td>
                              {datos.map((u, i) => {
                                const found = u.sindicatos.find(s => s.siglas === siglas);
                                const val = found?.delegados || 0;
                                const pct = u.totalDelegadosObtenidos > 0 ? ((val / u.totalDelegadosObtenidos) * 100).toFixed(1) : '0';
                                return (
                                  <td key={u.id} className="py-3 px-3 text-right">
                                    {val > 0 ? (
                                      <>
                                        <span className="font-black text-white">{val}</span>
                                        <span className="text-white/30 font-bold ml-1">({pct}%)</span>
                                      </>
                                    ) : <span className="text-white/20">—</span>}
                                  </td>
                                );
                              })}
                              <td className="py-3 pl-4 text-right font-black text-amber-400">{total}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-white/10">
                            <td className="py-3 pr-4 font-black text-white/40 uppercase text-[9px] tracking-widest">Total</td>
                            {datos.map((u, i) => (
                              <td key={u.id} className="py-3 px-3 text-right font-black" style={{ color: SESSION_COLORS[i] }}>
                                {u.totalDelegadosObtenidos}
                              </td>
                            ))}
                            <td className="py-3 pl-4 text-right font-black text-amber-400">{totalDelegados}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </ChartCard>
              )}

              <div id="pdf-chart-evolucion" className={vista !== 'evolucion' ? 'fixed -left-[10000px] top-0 w-[900px] -z-50 overflow-hidden' : ''}>
                <ChartCard title="Evolución por Sindicato (Top 6 · orden cronológico)">
                  {datos.length < 2 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <TrendingUp className="w-8 h-8 text-white/10" />
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Selecciona al menos 2 elecciones</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={360}>
                      <LineChart data={dataEvolucion} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                        <XAxis dataKey="label" tick={{ fill: '#ffffff40', fontSize: 9, fontWeight: 700 }} />
                        <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        {sindicatosTop6.map((s, i) => (
                          <Line isAnimationActive={false} key={s.siglas} type="monotone" dataKey={s.siglas} stroke={SESSION_COLORS[i]} strokeWidth={2.5} dot={{ fill: SESSION_COLORS[i], r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>

              <div id="pdf-chart-sector" className={vista !== 'sector' ? 'fixed -left-[10000px] top-0 w-[900px] -z-50 overflow-hidden' : ''}>
                <ChartCard title="Delegados por Sector Económico">
                  {dataSector.length === 0 ? <EmptyChart msg="Sin datos de sector" /> : (
                    <ResponsiveContainer width="100%" height={Math.max(300, dataSector.length * 55)}>
                      <BarChart data={dataSector} layout="vertical" margin={{ top: 5, right: 30, left: 110, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#ffffff40', fontSize: 10 }} />
                        <YAxis dataKey="sector" type="category" tick={{ fill: '#ffffff60', fontSize: 10, fontWeight: 700 }} width={105} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        {datos.map((_, i) => (
                          <Bar isAnimationActive={false} key={i} dataKey={`u${i}`} name={labelUnidad(i)} fill={SESSION_COLORS[i]} radius={[0, 4, 4, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>

              <div id="pdf-chart-representatividad" className={vista !== 'representatividad' ? 'fixed -left-[10000px] top-0 w-[900px] -z-50 overflow-hidden' : ''}>
                <ChartCard title="Índice de Representatividad — Acumulado de la Sesión">
                  {dataRepresentatividad.length === 0 ? <EmptyChart msg="Sin resultados consolidados" /> : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-4 mb-5">
                        {[
                          { label: '≥ 15% Alta', color: 'bg-emerald-500', text: 'text-emerald-400' },
                          { label: '≥ 10% Media', color: 'bg-amber-500', text: 'text-amber-400' },
                          { label: '< 10% Sin umbral', color: 'bg-white/20', text: 'text-white/30' },
                        ].map(l => (
                          <div key={l.label} className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${l.color}`} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${l.text}`}>{l.label}</span>
                          </div>
                        ))}
                      </div>
                      {dataRepresentatividad.map(({ siglas, total, pct }) => {
                        const isAlta = pct >= 15;
                        const isMed = pct >= 10;
                        const barColor = isAlta ? '#10b981' : isMed ? '#f59e0b' : '#ffffff15';
                        const textColor = isAlta ? 'text-emerald-400' : isMed ? 'text-amber-400' : 'text-white/30';
                        return (
                          <div key={siglas} className="flex items-center gap-3">
                            <div className="w-12 text-right shrink-0">
                              <span className="text-[11px] font-black text-white">{siglas}</span>
                            </div>
                            <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden relative">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 0.5)}%`, backgroundColor: barColor }} />
                              <span className="absolute inset-0 flex items-center pl-3 text-[10px] font-black text-white/50">{total} del.</span>
                            </div>
                            <div className="w-20 flex items-center justify-end gap-1.5 shrink-0">
                              <span className={`text-[11px] font-black ${textColor}`}>{pct.toFixed(1)}%</span>
                              {(isAlta || isMed) && (
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${isAlta ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                  {isAlta ? '≥15%' : '≥10%'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ChartCard>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Wrappers auxiliares ────────────────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0a101f]/80 border border-white/5 rounded-3xl p-5">
      <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-5">{title}</h2>
      {children}
    </div>
  );
}

function EmptyChart({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <BarChart3 className="w-8 h-8 text-white/10" />
      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest text-center">{msg}</p>
    </div>
  );
}
