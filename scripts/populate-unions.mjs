import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function populateSindicatos() {
  const sindicatos = [
    { id: 1, siglas: 'CSIF', nombre_completo: 'CENTRAL SINDICAL INDEPENDIENTE Y DE FUNCIONARIOS', orden_prioridad: 1 },
    { id: 2, siglas: 'UGT', nombre_completo: 'UNIÓN GENERAL DE TRABAJADORES', orden_prioridad: 2 },
    { id: 3, siglas: 'CCOO', nombre_completo: 'COMISIONES OBRERAS', orden_prioridad: 3 },
    { id: 4, siglas: 'CGT', nombre_completo: 'CONFEDERACIÓN GENERAL DEL TRABAJO', orden_prioridad: 4 },
    { id: 5, siglas: 'USO', nombre_completo: 'UNIÓN SINDICAL OBRERA', orden_prioridad: 5 },
    { id: 6, siglas: 'ELA', nombre_completo: 'EUSKO LANGILEEN ALKARTASUNA', orden_prioridad: 6 },
    { id: 7, siglas: 'LAB', nombre_completo: 'LANGILE ABERTZALEEN BATZORDEAK', orden_prioridad: 7 },
    { id: 8, siglas: 'CIG', nombre_completo: 'CONFEDERACIÓN INTERSINDICAL GALEGA', orden_prioridad: 8 },
    { id: 9, siglas: 'ANPE', nombre_completo: 'ANPE SINDICATO INDEPENDIENTE', orden_prioridad: 9 },
    { id: 10, siglas: 'STE-i', nombre_completo: 'CONFEDERACIÓN INTERSINDICAL', orden_prioridad: 10 },
    { id: 11, siglas: 'SATSE', nombre_completo: 'SINDICATO DE ENFERMERÍA', orden_prioridad: 11 },
    { id: 12, siglas: 'USAAE', nombre_completo: 'UNIÓN SINDICAL DE AUXILIARES DE ENFERMERÍA', orden_prioridad: 12 },
    { id: 13, siglas: 'Sindicato Médico', nombre_completo: 'CONFEDERACIÓN ESTATAL DE SINDICATOS MÉDICOS', orden_prioridad: 13 },
    { id: 14, siglas: 'SFP', nombre_completo: 'SINDICATO DE FUNCIONARIOS PÚBLICOS', orden_prioridad: 14 },
    { id: 15, siglas: 'CSI-F', nombre_completo: 'CSIF SECTORIAL', orden_prioridad: 15 },
    { id: 99, siglas: 'OTROS', nombre_completo: 'OTRAS CANDIDATURAS', orden_prioridad: 99 },
  ];

  console.log('Poblando sindicatos...');
  for (const sindicato of sindicatos) {
    const { error } = await supabase
      .from('sindicatos')
      .upsert(sindicato);
    if (error) console.error(`Error con ${sindicato.siglas}:`, error);
  }
  console.log('Listado de sindicatos actualizado con éxito.');
}

populateSindicatos();
