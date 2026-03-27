"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface SindicatoInput {
  id: number;
  siglas: string;
  votos: number;
}

const mockSindicatos: SindicatoInput[] = [
  { id: 1, siglas: "CSIF", votos: 0 },
  { id: 2, siglas: "UGT", votos: 0 },
  { id: 3, siglas: "CCOO", votos: 0 },
  { id: 4, siglas: "CGT", votos: 0 },
];

export default function UrnaForm({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [censo, setCenso] = useState<number | "">("");
  const [blancos, setBlancos] = useState<number>(0);
  const [nulos, setNulos] = useState<number>(0);
  const [sindicatos, setSindicatos] = useState<SindicatoInput[]>(mockSindicatos);
  const [fotoActa, setFotoActa] = useState<File | null>(null);
  
  const handleVotoChange = (id: number, value: string) => {
    const newVal = parseInt(value, 10);
    setSindicatos(prev => 
      prev.map(s => s.id === id ? { ...s, votos: isNaN(newVal) ? 0 : newVal } : s)
    );
  };

  const totalVotos = sindicatos.reduce((acc, curr) => acc + curr.votos, 0) + blancos + nulos;
  const isCensoValid = typeof censo === "number" && censo > 0;
  const isTotalExceeded = isCensoValid && totalVotos > censo;
  const canSubmit = isCensoValid && !isTotalExceeded && fotoActa !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    // En un escenario real: upload a Supabase Storage y guardar datos
    alert("Datos enviados con éxito a la mesa " + params.id);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-blue-900 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Mesa {params.id}</h1>
          <p className="text-sm opacity-80">Unidad Electoral: AGE Madrid</p>
        </div>
        <div className="text-right">
          <p className="text-xs">Identificado como</p>
          <p className="font-semibold text-sm">Interventor CSIF</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 mt-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Censo y Participación</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="censo">Censo Real (Total de electores en mesa)</Label>
                <Input 
                  id="censo" 
                  type="number" 
                  autoFocus
                  required
                  min="1"
                  className="text-lg py-6 placeholder:text-gray-300" 
                  placeholder="Ej: 450"
                  value={censo}
                  onChange={(e) => setCenso(e.target.value ? parseInt(e.target.value, 10) : "")}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="blancos">Votos Blancos</Label>
                  <Input 
                    id="blancos" 
                    type="number" 
                    min="0"
                    className="text-lg py-5"
                    value={blancos}
                    onChange={(e) => setBlancos(e.target.value ? parseInt(e.target.value, 10) : 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nulos" className="text-red-700">Votos Nulos</Label>
                  <Input 
                    id="nulos" 
                    type="number" 
                    min="0"
                    className="text-lg py-5 border-red-200"
                    value={nulos}
                    onChange={(e) => setNulos(e.target.value ? parseInt(e.target.value, 10) : 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b bg-gray-50">
              <CardTitle className="text-lg">Votos por Candidatura</CardTitle>
              <CardDescription>CSIF siempre se muestra en primer lugar.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {sindicatos.map((sindicato) => (
                <div key={sindicato.id} className={`flex items-center justify-between p-3 rounded-lg border ${sindicato.siglas === 'CSIF' ? 'bg-green-50 border-green-200 ring-1 ring-green-500' : 'bg-white'}`}>
                  <Label htmlFor={`sindicato-${sindicato.id}`} className={`text-xl font-bold ${sindicato.siglas === 'CSIF' ? 'text-green-800' : 'text-gray-700'}`}>
                    {sindicato.siglas}
                  </Label>
                  <Input 
                    id={`sindicato-${sindicato.id}`}
                    type="number" 
                    min="0"
                    className="w-24 text-center text-xl font-bold py-6"
                    value={sindicato.votos === 0 ? '' : sindicato.votos}
                    onChange={(e) => handleVotoChange(sindicato.id, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Evidencia del Escrutinio</CardTitle>
              <CardDescription>Haz una foto al acta oficial firmada.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <Label htmlFor="foto" className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-blue-400 focus:outline-none">
                  {fotoActa ? (
                    <span className="flex items-center space-x-2 text-green-600 font-semibold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      <span>Foto ({fotoActa.name})</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2 text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span className="font-medium text-blue-600">Subir foto o Capturar</span>
                    </span>
                  )}
                  <Input 
                    id="foto" 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    onChange={(e) => setFotoActa(e.target.files?.[0] || null)}
                  />
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Validation Box */}
          <div className="p-4 rounded-lg bg-gray-100 space-y-2 text-sm text-gray-600 font-medium">
            <div className="flex justify-between">
              <span>Total Votos Sumados:</span>
              <span className={`font-bold ${isTotalExceeded ? 'text-red-600' : 'text-green-600'}`}>{totalVotos}</span>
            </div>
            <div className="flex justify-between">
              <span>Censo Introducido:</span>
              <span className="font-bold">{censo || 0}</span>
            </div>
          </div>

          <div className="sticky bottom-4 z-20">
            {isTotalExceeded && (
              <div className="mb-2 p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-200">
                ¡Alerta! La suma de votos y blancos supera el censo. Imposible enviar.
              </div>
            )}
            <Button 
               type="submit" 
               disabled={!canSubmit}
               className="w-full h-14 text-lg font-bold shadow-xl disabled:bg-gray-300 disabled:text-gray-500 bg-blue-700 hover:bg-blue-800"
            >
              {canSubmit ? "ENVIAR RESULTADOS" : "COMPLETA LOS DATOS"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
