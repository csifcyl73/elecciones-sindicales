"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, Save, CheckCircle2, ShieldCheck, Mail, Users, Inbox, Building2, UploadCloud, MapPin, Lock, MessageSquare } from 'lucide-react';

export default function FormularioEscrutinio() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const mesaId = params.id as string;

  const [mesa, setMesa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form State
  const [censo, setCenso] = useState<number | ''>('');
  const [votosBlancos, setVotosBlancos] = useState<number | ''>('');
  const [votosNulos, setVotosNulos] = useState<number | ''>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [votosCandidaturas, setVotosCandidaturas] = useState<Record<string, number>>({});

  useEffect(() => {
     loadMesa();
  }, [mesaId]);

  const loadMesa = async () => {
      try {
         // Comprobar Auth primero
         const { data: { session } } = await supabase.auth.getSession();
         if (!session) return router.replace('/interventor');

         const res = await fetch(`/api/interventor/mesa/${mesaId}`);
         const data = await res.json();
         if (!res.ok) throw new Error(data.error);
         
         setMesa(data);
         setCenso(data.censo_real || '');
         setVotosBlancos(data.votos_blancos || '');
         setVotosNulos(data.votos_nulos || '');
         
         // Inicializamos el mapa de votos con 0 por defecto o con lo que venga de BD
         if (data.unidades_electorales?.unidades_sindicatos) {
             const vMap: Record<string, number> = {};
             data.unidades_electorales.unidades_sindicatos.forEach((us: any) => {
                 vMap[us.sindicatos.id] = 0;
             });

             if (data.votos_candidaturas) {
                 data.votos_candidaturas.forEach((v: any) => {
                    vMap[v.sindicato_id] = v.votos_obtenidos;
                 });
             }
             setVotosCandidaturas(vMap);
         }
      } catch (e: any) {
         setError(e.message);
      } finally {
         setLoading(false);
      }
  };

  const handleVotosChange = (sindicatoId: number, valor: string) => {
      setVotosCandidaturas(prev => ({
          ...prev,
          [sindicatoId]: valor === '' ? 0 : parseInt(valor)
      }));
  };

  const handleSave = async () => {
      setSaving(true);
      setError('');
      try {
          const payload = {
              censo_real: censo === '' ? 0 : censo,
              votos_blancos: votosBlancos === '' ? 0 : votosBlancos,
              votos_nulos: votosNulos === '' ? 0 : votosNulos,
              observaciones: observaciones,
              votos_candidaturas: Object.entries(votosCandidaturas).map(([sId, votos]) => ({
                  sindicato_id: parseInt(sId),
                  votos_obtenidos: votos
              }))
          };

          const res = await fetch(`/api/interventor/mesa/${mesaId}`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          setSuccess(true);
          setTimeout(() => router.push('/interventor/dashboard'), 2500);
      } catch (e: any) {
          setError(e.message || "Error al guardar el escrutinio. Verifique su conexión y los campos.");
      } finally {
          setSaving(false);
      }
  };

  if (loading) {
     return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
         <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
     </div>;
  }

  if (!mesa) {
     return <div className="min-h-screen flex items-center justify-center font-black text-gray-400">Mesa no encontrada</div>;
  }

  // Bloqueo: si la unidad electoral está congelada, no permitir escrutinio
  const isCongelada = mesa.unidades_electorales?.estado === 'congelada';
  if (isCongelada) {
     return (
       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
         <div className="bg-white p-12 rounded-3xl shadow-lg border-2 border-blue-200 max-w-lg w-full text-center space-y-6">
           <div className="p-4 bg-blue-50 rounded-2xl inline-block mx-auto">
             <Lock className="w-12 h-12 text-blue-600" />
           </div>
           <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Elección Bloqueada</h2>
           <p className="text-gray-500 font-medium">
             Los resultados de <span className="font-black text-gray-700">{mesa.unidades_electorales?.nombre}</span> han sido bloqueados oficialmente por el Administrador Nacional. No se admiten más modificaciones.
           </p>
           <button
             onClick={() => router.push('/interventor/dashboard')}
             className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl uppercase text-xs tracking-widest transition-colors"
           >
             Volver al Panel
           </button>
         </div>
       </div>
     );
  }

  const sindicatos = mesa.unidades_electorales?.unidades_sindicatos?.map((u: any) => u.sindicatos) || [];
  const provinciaStr = mesa.unidades_electorales?.provincias?.nombre || 'General';

  let colegioLabel = null;
  let cleanMesaName = mesa?.nombre_identificador || '';
  if (cleanMesaName.toUpperCase().includes('[TÉCNICOS]')) {
      colegioLabel = 'Colegio de Técnicos y Administrativos';
      cleanMesaName = cleanMesaName.replace(/\[TÉCNICOS\]\s*/i, '');
  } else if (cleanMesaName.toUpperCase().includes('[ESPECIALISTAS]')) {
      colegioLabel = 'Colegio de Especialistas y No Cualificados';
      cleanMesaName = cleanMesaName.replace(/\[ESPECIALISTAS\]\s*/i, '');
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navbar Superior */}
      <header className="h-20 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
            <button
                onClick={() => router.push('/interventor/dashboard')}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
                title="Volver"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-800 tracking-tight leading-tight">
                Escrutinio <span className="text-emerald-700">Oficial</span>
              </h1>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{mesa.estado === 'enviada' ? 'MODIFICANDO ACTA EXISTENTE' : 'NUEVO REGISTRO'}</p>
            </div>
        </div>
        
        <div className="shrink-0 ml-4">
          <a
            href="https://notebooklm.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 font-bold rounded-xl transition-colors shadow-sm text-sm"
            title="Asistente IA - Manual de Elecciones"
          >
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">Manual / Ayuda IA</span>
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-4 space-y-6">
         
         {/* CABECERA (Bloqueado) */}
         <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Resumen de Adscripción
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Provincia</label>
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center gap-3 h-full">
                      <MapPin className="text-emerald-600 w-5 h-5 opacity-70 shrink-0" />
                      <span className="font-semibold text-gray-700">{provinciaStr}</span>
                   </div>
                </div>
                
                <div className="md:col-span-2">
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Unidad Electoral & Mesa</label>
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-2 relative overflow-hidden">
                      {colegioLabel && (
                          <div className="absolute top-0 right-0 py-1 border-b border-l border-emerald-500/20 px-3 bg-emerald-50 text-[9px] font-black uppercase tracking-widest text-emerald-600 rounded-bl-xl shadow-sm">
                              {colegioLabel}
                          </div>
                      )}
                      <div className="flex items-center gap-3">
                         <Building2 className="text-emerald-600 w-5 h-5 opacity-70 shrink-0" />
                         <span className="font-semibold text-gray-700 line-clamp-1 flex-1">{mesa.unidades_electorales?.nombre}</span>
                         <span className="px-3 py-1 bg-gray-200 rounded-lg text-xs font-bold whitespace-nowrap mt-4 md:mt-0 shadow-sm border border-gray-300">{cleanMesaName}</span>
                      </div>
                   </div>
                </div>
            </div>
         </div>

         {/* CENSO */}
         <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-emerald-500/20">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" /> Censo Total Real
            </h2>
            <div className="relative">
                <input
                    type="number"
                    min="0"
                    placeholder="Número de electores oficiales..."
                    value={censo}
                    onChange={(e) => setCenso(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full text-2xl font-black text-emerald-900 bg-emerald-50/50 p-6 rounded-2xl border-2 border-emerald-100 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all placeholder:text-emerald-200"
                />
            </div>
         </div>

         {/* VOTOS CANDIDATURAS */}
         <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-blue-500" /> VOTOS A CANDIDATURAS OFICIALES
            </h2>
            <div className="space-y-4">
                {sindicatos.length === 0 ? (
                    <div className="p-6 bg-yellow-50 text-yellow-700 rounded-xl font-bold flex items-center justify-center border border-yellow-200">
                        No hay candidaturas asociadas a esta Unidad Electoral.
                    </div>
                ) : (
                    sindicatos.map((sindicato: any) => (
                        <div key={sindicato.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl gap-4 hover:border-gray-300 transition-colors">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center font-black text-gray-300">
                                   {sindicato.siglas.substring(0, 3)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">{sindicato.siglas}</h4>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{sindicato.nombre_completo}</p>
                                </div>
                            </div>
                            <input
                                type="number"
                                min="0"
                                value={votosCandidaturas[sindicato.id] ?? ''}
                                onChange={(e) => handleVotosChange(sindicato.id, e.target.value)}
                                className="w-full sm:w-32 text-center text-xl font-black bg-white border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                placeholder="0"
                            />
                        </div>
                    ))
                )}
            </div>
         </div>

         {/* BLANCOS Y NULOS */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                 <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Votos en Blanco</h2>
                 <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={votosBlancos}
                    onChange={(e) => setVotosBlancos(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full text-center text-xl font-black bg-gray-50 border-2 border-gray-200 p-4 rounded-xl focus:border-gray-500 outline-none transition-all"
                />
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                 <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 text-red-500">Votos Nulos</h2>
                 <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={votosNulos}
                    onChange={(e) => setVotosNulos(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full text-center text-xl font-black bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl focus:border-red-500 outline-none transition-all"
                />
            </div>
         </div>

         {/* OBSERVACIONES Y ACTA ESCANEADA */}
         <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div>
                 <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Observaciones e Incidencias</h2>
                 <textarea
                     placeholder="Escribe aquí cualquier incidencia (ej. impugnaciones, anomalías en el censo...)"
                     rows={3}
                     value={observaciones}
                     onChange={(e) => setObservaciones(e.target.value)}
                     className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-xl focus:border-blue-500 outline-none transition-all resize-y text-gray-700 font-medium"
                 />
            </div>
            <div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Acta Oficial Escaneada</h2>
                <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 transition-colors">
                    <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="font-bold text-gray-600 mb-1">Haz clic o arrastra el documento del acta (PDF/JPG)</p>
                    <p className="text-xs text-gray-400">Tamaño máximo: 5MB</p>
                    <input type="file" className="hidden" />
                </div>
            </div>
         </div>

         {/* MENSAJES Y BOTONES */}
         {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold flex items-center justify-center mt-6">
               {error}
            </div>
         )}

         {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl font-bold flex items-center justify-center gap-3 animate-pulse mt-6">
               <CheckCircle2 className="w-6 h-6" /> ¡Registro guardado y enviado oficialmnete!
            </div>
         )}

         <div className="pt-6">
             <button
                 onClick={handleSave}
                 disabled={saving || success}
                 className="w-full py-5 text-lg font-black text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none"
             >
                 {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                 {saving ? 'GRABANDO EN SISTEMA...' : 'GRABAR Y CERTIFICAR RESULTADOS'}
             </button>
         </div>

      </main>
    </div>
  );
}
