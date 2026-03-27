import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">
            Elecciones Sindicales CSIF
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de escrutinio y visualización en tiempo real.
          </p>
        </div>

        <Card className="shadow-lg border-0 ring-1 ring-gray-200">
          <CardHeader>
            <CardTitle>Accesos por Rol</CardTitle>
            <CardDescription>
              Selecciona tu rol para acceder a la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/mesa/demo-123" passHref>
              <Button className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700">
                Soy Interventor (Urna)
              </Button>
            </Link>
            <Link href="/dashboard" passHref>
              <Button variant="outline" className="w-full h-12 text-lg font-semibold border-blue-200 text-blue-800 hover:bg-blue-50">
                Dashboard (Visualizador)
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
