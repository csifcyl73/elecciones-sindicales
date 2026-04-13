"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  Inbox, 
  Building2, 
  UploadCloud, 
  MapPin, 
  Lock,
  AlertTriangle
} from 'lucide-react';

const supabase = createClient();

export default function ProxyFormularioEscrutinio() {
  const router = useRouter();
  const params = useParams();
//  const supabase = createClient(); // Eliminado el de lib/supabase para usar el estándar del portal admin
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
         const res = await fetch(`/api/interventor/mesa/${mesaId}`);
         const data = await res.json();
         if (!res.ok) throw new Error(data.error);
         
         setMesa(data);
         setCenso(data.censo_real || '');
         setVotosBlancos(data.votos_blancos || '');
         setVotosNulos(data.votos_nulos || '');
         setObservaciones(data.observaciones || '');
         
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
          setTimeout(() => router.push('/admin/nacional/interventor-nacional'), 2500);
      } catch (e: any) {
          setError(e.message || "Error al guardar el escrutinio.");
      } finally {
          setSaving(false);
      }
  };

  if (loading) {
     return <div className="min-h-screen bg-[#0a101f] flex items-center justify-center">
         <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
     </div>;
  }

  if (!mesa) {
     return <div className="min-h-screen bg-[#0a101f] flex flex-col items-center justify-center font-black text-white/20 uppercase gap-4">
        <AlertTriangle className="w-12 h-12" />
        Mesa no encontrada
     </div>;
  }

  const sindicatos = mesa.unidades_electorales?.unidades_sindicatos?.map((u: any) => u.sindicatos) || [];
  const provinciaStr = mesa.unidades_electorales?.provincias?.nombre || 'General';

  return (
    <div className="min-h-screen bg-[#0a101f] text-white p-4 md:p-12 pb-32">
       <div className="max-w-4xl mx-auto">
          {/* Header Proxy */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <button 
                onClick={() => router.push('/admin/nacional/interventor-nacional')}
                className="group flex items-center gap-2 text-white/30 hover:text-white transition-colors mb-6"
              >
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:border-white/20">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="font-black uppercase tracking-[0.2em] text-[10px]">Portal Intervención Nacional</span>
              </button>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">
                Carga de Datos <br />
                <span className="text-black bg-emerald-400 px-4 py-2 inline-block -skew-x-6 mt-2">Mesa Proxy</span>
              </h1>
            </div>
            
            <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center gap-4">
               <ShieldCheck className="w-8 h-8 text-amber-500" />
               <div>
                  <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest leading-none mb-1">Status Administrador</p>
                  <p className="text-xs font-bold text-white/60">Sobreescritura de datos habilitada</p>
               </div>
            </div>
          </div>

          <div className="space-y-8">
             {/* Info Mesa */}
             <div className="bg-[#111827]/60 backdrop-blur-xl border border-white/10 rounded-[40px] p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Unidad Electoral</p>
                      <p className="text-lg font-black text-white uppercase truncate">{mesa.unidades_electorales?.nombre}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Identificador Mesa</p>
                      <p className="text-lg font-black text-emerald-400 uppercase">{mesa.nombre_identificador}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Provincia</p>
                      <p className="text-lg font-black text-white uppercase">{provinciaStr}</p>
                   </div>
                </div>
             </div>

             {/* Formulario Principal */}
             <div className="grid grid-cols-1 gap-8">
                
                {/* CENSO */}
                <div className="bg-white/5 border border-white/10 rounded-[40px] p-10">
                   <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                      <Users className="w-5 h-5" /> Censo Total Real
                   </h3>
                   <input
                      type="number"
                      placeholder="Número de electores..."
                      value={censo}
                      onChange={(e) => setCenso(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-4xl font-black text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-white/5"
                   />
                </div>

                {/* VOTOS */}
                <div className="bg-white/5 border border-white/10 rounded-[40px] p-10">
                   <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                      <Inbox className="w-5 h-5" /> Votos Candidaturas
                   </h3>
                   <div className="space-y-4">
                      {sindicatos.map((s: any) => (
                         <div key={s.id} className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl gap-6 hover:bg-white/[0.07] transition-all">
                            <div className="flex items-center gap-5 w-full">
                               <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center font-black text-white/20 border border-white/10 uppercase italic">
                                  {s.siglas.slice(0,3)}
                               </div>
                               <div>
                                  <h4 className="text-lg font-black text-white uppercase tracking-tight">{s.siglas}</h4>
                                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest truncate max-w-[250px]">{s.nombre_completo}</p>
                               </div>
                            </div>
                            <input
                              type="number"
                              value={votosCandidaturas[s.id] ?? ''}
                              onChange={(e) => handleVotosChange(s.id, e.target.value)}
                              className="w-full sm:w-32 bg-white/10 border border-white/10 p-4 rounded-xl text-center text-2xl font-black text-white focus:border-emerald-500 outline-none transition-all"
                              placeholder="0"
                            />
                         </div>
                      ))}
                   </div>
                </div>

                {/* BLANCO Y NULO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white/5 border border-white/10 rounded-[40px] p-8">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Votos en Blanco</p>
                      <input
                        type="number"
                        value={votosBlancos}
                        onChange={(e) => setVotosBlancos(e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl text-center text-3xl font-black text-white focus:border-emerald-500 outline-none"
                      />
                   </div>
                   <div className="bg-white/5 border border-white/10 rounded-[40px] p-8">
                      <p className="text-[10px] font-black text-rose-500/50 uppercase tracking-widest mb-4">Votos Nulos</p>
                      <input
                        type="number"
                        value={votosNulos}
                        onChange={(e) => setVotosNulos(e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl text-center text-3xl font-black text-rose-500 focus:border-rose-500 outline-none"
                      />
                   </div>
                </div>

                {/* OBSERVACIONES */}
                <div className="bg-white/5 border border-white/10 rounded-[40px] p-10">
                   <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-6">Observaciones del Administrador</h3>
                   <textarea
                      rows={4}
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Añade cualquier nota sobre por qué se realiza esta carga manual..."
                      className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-white font-medium focus:outline-none focus:border-emerald-500 transition-all resize-none"
                   />
                </div>

                {/* ACCIÓN FINAL */}
                <div className="pt-10">
                    {error && <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-2xl text-center uppercase tracking-widest">{error}</div>}
                    {success && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-2xl text-center uppercase tracking-widest animate-pulse flex items-center justify-center gap-2">
                       <CheckCircle2 className="w-4 h-4" /> Datos Guardados Correctamente
                    </div>}

                   <button
                      onClick={handleSave}
                      disabled={saving || success}
                      className="w-full py-8 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-3xl uppercase tracking-[0.4em] text-sm transition-all active:scale-95 disabled:opacity-50 shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3"
                   >
                      {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                      {saving ? 'GRABANDO EN SISTEMA...' : 'DILIGENCIAR Y GUARDAR'}
                   </button>
                </div>

             </div>
          </div>
       </div>
    </div>
  );
}
