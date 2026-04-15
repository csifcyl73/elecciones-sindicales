"use client";
import React, { useRef, useState } from 'react';
import {
  X, Upload, FileSpreadsheet, CheckCircle2,
  AlertTriangle, Loader2, Download, Info
} from 'lucide-react';

interface ImportResult {
  importadas: number;
  actualizadas: number;
  errores: { fila: number; motivo: string }[];
}

interface ModalImportarHistoricoProps {
  onClose: () => void;
  onSuccess: () => void;
  perfil: 'nacional' | 'autonomico';
}

export default function ModalImportarHistorico({ onClose, onSuccess, perfil }: ModalImportarHistoricoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<any[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  // ── Descarga de plantilla ──────────────────────────────────────
  const handleDescargarPlantilla = async () => {
    const { utils, writeFile } = await import('xlsx');

    const SINDICATOS_EJEMPLO = ['CSIF', 'UGT', 'CCOO', 'USO', 'OTROS'];
    const headers: Record<string, string | number> = {
      PROVINCIA: 'MADRID',
      MUNICIPIO: 'ALCALÁ DE HENARES',
      SECTOR: 'EDUCACIÓN',
      TIPO_ORGANO: 'JUNTA DE PERSONAL',
      'AÑO': 2022,
      UNIDAD_ELECTORAL: 'CONSEJERÍA DE EDUCACIÓN MADRID',
      CENSO: 450,
      DELEGADOS_TOTAL: 13,
    };
    SINDICATOS_EJEMPLO.forEach(s => { headers[`DELEGADOS_${s}`] = 0; });

    const ws = utils.json_to_sheet([headers]);
    // Ancho de columnas automático
    ws['!cols'] = Object.keys(headers).map(k => ({ wch: Math.max(k.length + 4, 18) }));

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Plantilla');
    writeFile(wb, 'plantilla_importacion_historica.xlsx');
  };

  // ── Parseo del Excel ──────────────────────────────────────────
  const parseExcel = async (file: File) => {
    setParseError(null);
    setRows(null);
    setResult(null);

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setParseError('Formato no válido. Usa un archivo .xlsx o .xls.');
      return;
    }

    try {
      const { read, utils } = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[] = utils.sheet_to_json(ws, { defval: '' });

      if (data.length === 0) {
        setParseError('El archivo no contiene datos. Revisa que la primera fila tenga las cabeceras correctas.');
        return;
      }

      // Normalizar cabeceras (trim + uppercase)
      const normalizedRows = data.map(row => {
        const normalized: Record<string, any> = {};
        for (const [k, v] of Object.entries(row)) {
          normalized[k.trim().toUpperCase()] = typeof v === 'string' ? v.trim() : v;
        }
        return normalized;
      });

      // Validar cabeceras obligatorias
      const required = ['PROVINCIA', 'SECTOR', 'TIPO_ORGANO', 'UNIDAD_ELECTORAL', 'DELEGADOS_TOTAL'];
      const firstRow = normalizedRows[0];
      const missing = required.filter(h => !(h in firstRow) && !(`AÑO` in firstRow || `ANO` in firstRow));
      // Check year separately
      if (!('AÑO' in firstRow) && !('ANO' in firstRow)) {
        setParseError('Falta la columna AÑO. Descarga la plantilla y úsala como base.');
        return;
      }
      const missingCols = required.filter(h => !(h in firstRow));
      if (missingCols.length > 0) {
        setParseError(`Faltan columnas obligatorias: ${missingCols.join(', ')}. Descarga la plantilla.`);
        return;
      }

      if (normalizedRows.length > 500) {
        setParseError(`El archivo tiene ${normalizedRows.length} filas. El límite es 500. Divídelo en partes.`);
        return;
      }

      setRows(normalizedRows);
      setFileName(file.name);
    } catch (e: any) {
      setParseError(`Error leyendo el archivo: ${e.message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseExcel(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseExcel(file);
  };

  // ── Envío a la API ────────────────────────────────────────────
  const handleImportar = async () => {
    if (!rows) return;
    setImporting(true);
    setResult(null);
    try {
      const resp = await fetch('/api/admin/importar-historico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error en el servidor.');
      setResult(data);
      if (data.importadas > 0 || data.actualizadas > 0) {
        onSuccess(); // Recargar el listado de elecciones
      }
    } catch (err: any) {
      setParseError(`Error importando: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const totalOk = (result?.importadas || 0) + (result?.actualizadas || 0);
  const hasErrors = (result?.errores?.length || 0) > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#0d1626] border border-white/10 w-full max-w-2xl rounded-[40px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[90vh]">
        
        {/* Franja superior de color */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

        {/* Cabecera */}
        <div className="flex items-start justify-between p-8 pb-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <FileSpreadsheet className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <p className="text-[9px] font-black text-amber-400/70 uppercase tracking-[0.4em] mb-0.5">
                {perfil === 'nacional' ? 'Administrador Nacional' : 'Administrador Autonómico'}
              </p>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
                Importar Datos Históricos
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo scrollable */}
        <div className="overflow-y-auto px-8 pb-8 space-y-6 flex-1">

          {/* Instrucciones + Descargar plantilla */}
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-3xl p-5 flex gap-4 items-start">
            <Info className="w-5 h-5 text-amber-400/70 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <p className="text-[11px] font-black text-amber-300 uppercase tracking-widest">Modo B — Por Delegados Obtenidos</p>
              <p className="text-[10px] text-white/40 font-medium leading-relaxed">
                Introduce los delegados finales de cada sindicato. Las unidades se crearán con estado <span className="text-blue-400 font-black">«Resultados Oficiales»</span>.
                Usa una columna <span className="text-amber-300 font-mono">DELEGADOS_SIGLAS</span> por cada sindicato presente.
              </p>
              <button
                onClick={handleDescargarPlantilla}
                className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar plantilla de ejemplo (.xlsx)
              </button>
            </div>
          </div>

          {/* Zona de drop */}
          {!result && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                dragging
                  ? 'border-amber-500/70 bg-amber-500/5 scale-[1.01]'
                  : rows
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-white/10 hover:border-amber-500/40 hover:bg-amber-500/5'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              {rows ? (
                <div className="space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <p className="text-emerald-400 font-black uppercase tracking-widest text-sm">{fileName}</p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                    {rows.length} fila{rows.length !== 1 ? 's' : ''} listas para importar
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); setRows(null); setFileName(null); }}
                    className="text-[9px] font-black text-white/20 uppercase tracking-widest hover:text-rose-400 transition-colors mt-2"
                  >
                    Cambiar archivo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-white/20 mx-auto" />
                  <p className="text-white/50 font-black uppercase tracking-widest text-sm">
                    Arrastra tu Excel aquí
                  </p>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                    o haz clic para seleccionarlo · .xlsx / .xls
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error de parseo */}
          {parseError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex gap-3 items-start animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-rose-300 leading-relaxed">{parseError}</p>
            </div>
          )}

          {/* Resultado de la importación */}
          {result && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Resumen */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center">
                  <p className="text-4xl font-black text-emerald-400">{result.importadas}</p>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1">Nuevas creadas</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 text-center">
                  <p className="text-4xl font-black text-blue-400">{result.actualizadas}</p>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1">Actualizadas</p>
                </div>
              </div>

              {totalOk > 0 && (
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-[11px] font-black text-emerald-300 uppercase tracking-widest">
                    {totalOk} elección{totalOk !== 1 ? 'es' : ''} importada{totalOk !== 1 ? 's' : ''} correctamente.
                    Aparecerán en el listado con estado «Resultados Oficiales».
                  </p>
                </div>
              )}

              {/* Errores por fila */}
              {hasErrors && (
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-5 space-y-3">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {result.errores.length} fila{result.errores.length !== 1 ? 's' : ''} con error
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {result.errores.map((e, i) => (
                      <div key={i} className="flex gap-3 items-start text-[10px]">
                        <span className="font-black text-rose-400/70 shrink-0 font-mono">F{e.fila}</span>
                        <span className="text-white/40 leading-relaxed">{e.motivo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="px-8 pb-8 shrink-0 space-y-3">
          {!result ? (
            <button
              onClick={handleImportar}
              disabled={!rows || importing}
              className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase tracking-widest rounded-2xl text-sm transition-all shadow-[0_10px_40px_rgba(245,158,11,0.3)] active:scale-95 disabled:opacity-40 disabled:grayscale flex items-center justify-center gap-3"
            >
              {importing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Importando...</>
              ) : (
                <><Upload className="w-5 h-5" /> Importar {rows ? `${rows.length} Elecciones` : ''}</>
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl text-sm transition-all active:scale-95"
            >
              Cerrar y Ver Resultados
            </button>
          )}
          {!result && (
            <button
              onClick={onClose}
              className="w-full py-3 text-white/20 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
