"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const dataEscrutinio = [
  { name: "CSIF", delegados: 12, fill: "#22c55e" }, // Green
  { name: "UGT", delegados: 8, fill: "#ef4444" },   // Red
  { name: "CCOO", delegados: 7, fill: "#ef4444" },  // Red-ish
  { name: "CGT", delegados: 2, fill: "#000000" },   // Black
];

const mesasEscutadas = [
  { id: "M1", nombre: "Mesa Principal AGE", actu: "100%", estado: "Enviada", actaUrl: "#" },
  { id: "M2", nombre: "Mesa Periférica 1", actu: "100%", estado: "Enviada", actaUrl: "#" },
  { id: "M3", nombre: "Mesa Periférica 2", actu: "Pendiente", estado: "Pendiente", actaUrl: "" },
];

export default function Dashboard() {
  const [actaModal, setActaModal] = useState<string | null>(null);

  const handleDescargarPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('dashboard-main-content');
      if (!element) return;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: 'Informe_Electoral_Global.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#f9fafb' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
      };

      html2pdf().from(element).set(opt).save();
    } catch (e) {
      console.error(e);
      alert("Error al generar el PDF");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans">
      {/* Header Realtime */}
      <header className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <span className="flex items-center text-xs font-semibold bg-green-500/20 text-green-300 px-3 py-1 rounded-full border border-green-500/30">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            ACTUALIZACIÓN EN TIEMPO REAL
          </span>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 pt-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
              Escrutinio Sindical 2026
            </h1>
            <p className="text-blue-200 text-lg md:text-xl font-light">Visualizador de Resultados Consolidado</p>
          </div>
          <Button 
            onClick={handleDescargarPDF}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md rounded-xl font-bold py-6 px-6 shadow-2xl flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-down"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
            DESCARGAR INFORME PDF
          </Button>
        </div>
      </header>

      <div id="dashboard-main-content">
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 mt-[-2rem] relative z-20">
        
        {/* Cascade Filters */}
        <Card className="shadow-2xl border-0 ring-1 ring-gray-900/5 bg-white backdrop-blur-sm rounded-2xl">
          <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select defaultValue="todas">
              <SelectTrigger className="h-12 border-gray-200 bg-gray-50/50"><SelectValue placeholder="CCAA" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las CCAA</SelectItem>
                <SelectItem value="madrid">Comunidad de Madrid</SelectItem>
              </SelectContent>
            </Select>
            <Select disabled>
              <SelectTrigger className="h-12 border-gray-200 bg-gray-50/50"><SelectValue placeholder="Provincia" /></SelectTrigger>
              <SelectContent></SelectContent>
            </Select>
            <Select defaultValue="age">
              <SelectTrigger className="h-12 border-gray-200 bg-gray-50/50"><SelectValue placeholder="Sector" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="age">Administración General (AGE)</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-12 border-gray-200 bg-gray-50/50"><SelectValue placeholder="Unidad Electoral" /></SelectTrigger>
              <SelectContent><SelectItem value="u1">Junta Personal AGE Madrid</SelectItem></SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="font-semibold text-gray-500 text-xs tracking-wider uppercase">Porcentaje Escrutado</CardDescription>
              <CardTitle className="text-4xl font-extrabold text-blue-900">82.4%</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="font-semibold text-gray-500 text-xs tracking-wider uppercase">Participación</CardDescription>
              <CardTitle className="text-4xl font-extrabold text-blue-900">65.1%</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-lg border-0 bg-white col-span-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-green-50 opacity-50 pointer-events-none"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardDescription className="font-semibold tracking-wider text-green-700 text-xs">PRIMERA FUERZA (CSIF)</CardDescription>
              <CardTitle className="text-4xl font-extrabold text-green-700 flex items-baseline gap-2">
                12 Delegados
                <span className="text-sm font-semibold opacity-75">/ 41.3% votos</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Graphics & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Hemiciclo */}
          <Card className="lg:col-span-2 shadow-xl border-0 rounded-2xl flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Reparto de Delegados
              </CardTitle>
              <CardDescription>Representación gráfica según algoritmo de Restos Mayores</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-end relative h-80 min-h-64 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataEscrutinio}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius="60%"
                    outerRadius="100%"
                    paddingAngle={2}
                    dataKey="delegados"
                  >
                    {dataEscrutinio.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={2} className="cursor-pointer hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(val: any) => [`${val} delegados`, 'Asignados']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-8 flex gap-4 text-xs font-semibold text-gray-600 bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm ring-1 ring-gray-100">
                {dataEscrutinio.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: d.fill }}></span>
                    {d.name}: {d.delegados}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Listado Mesas */}
          <Card className="shadow-xl border-0 rounded-2xl flex flex-col max-h-[500px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                Mesas Constituidas
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead>Mesa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Evidencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mesasEscutadas.map((mesa) => (
                    <TableRow key={mesa.id}>
                      <TableCell className="font-medium text-sm">
                        {mesa.nombre}
                      </TableCell>
                      <TableCell>
                        {mesa.estado === "Enviada" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Escrutada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span> Pendiente
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {mesa.estado === "Enviada" && (
                          <Button variant="ghost" size="sm" onClick={() => setActaModal(mesa.nombre)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                            Ver Acta
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
      </div>

      {/* Modal Visor de Actas (Basic pure react implementation) */}
      {actaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActaModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Acta - {actaModal}</h3>
              <Button variant="ghost" size="sm" onClick={() => setActaModal(null)}>Cerrar</Button>
            </div>
            <div className="p-8 bg-gray-200 flex flex-col items-center justify-center min-h-64">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              <p className="text-gray-500 text-sm font-medium">Previsualización de imagen subida</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
