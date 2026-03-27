export interface Candidatura {
  sindicato_id: number;
  sindicato_nombre: string;
  votos: number;
  delegadosDirectos?: number;
  delegadosRestos?: number;
  delegadosTotales?: number;
  resto?: number;
}

export interface ResultadoEscrutinio {
  candidaturas: Candidatura[];
  empatePendiente: boolean;
  sindicatosEmpatados?: number[]; // IDs
}

export function calcularRestosMayores(
  candidaturas: Candidatura[],
  votosBlancos: number,
  votosNulos: number, // no cuentan para válidos
  delegadosAElegir: number
): ResultadoEscrutinio {
  // 1. Votos Válidos = Blancos + Votos a Candidaturas
  const votosCandidaturasTotal = candidaturas.reduce((sum, c) => sum + c.votos, 0);
  const votosValidos = votosCandidaturasTotal + votosBlancos;

  if (votosValidos === 0 || delegadosAElegir === 0) {
    return {
      candidaturas: candidaturas.map(c => ({
        ...c,
        delegadosDirectos: 0,
        delegadosRestos: 0,
        delegadosTotales: 0,
        resto: 0
      })),
      empatePendiente: false
    };
  }

  // 2. Filtro 5%
  const barrera = votosValidos * 0.05;
  const candidaturasFiltradas = candidaturas.filter(c => c.votos >= barrera);
  
  // Si nadie supera el 5%, en algunas layes se ignora la barrera, o nadie obtiene delegados. Asumimos 0 delegados.
  if (candidaturasFiltradas.length === 0) {
    return {
      candidaturas: candidaturas.map(c => ({
        ...c,
        delegadosDirectos: 0,
        delegadosRestos: 0,
        delegadosTotales: 0,
        resto: 0
      })),
      empatePendiente: false
    };
  }

  // Votos Válidos Computables (de las que superan barrera según PRD "Suma de votos válidos computables")
  const votosValidosComputables = candidaturasFiltradas.reduce((sum, c) => sum + c.votos, 0);
  
  // 3. Cociente
  const cociente = votosValidosComputables / delegadosAElegir;

  let delegadosAsignados = 0;
  
  // 4. Asignación Directa y cálculo de Restos
  const asignacionesV1 = candidaturas.map(c => {
    if (c.votos < barrera) {
      return { ...c, delegadosDirectos: 0, delegadosRestos: 0, delegadosTotales: 0, resto: 0 };
    }
    const directos = Math.floor(c.votos / cociente);
    const resto = c.votos - (directos * cociente); // o equivalentemente c.votos % cociente
    delegadosAsignados += directos;
    return { ...c, delegadosDirectos: directos, delegadosRestos: 0, delegadosTotales: directos, resto };
  });

  // 5. Repartir restos
  let delegadosRestantes = delegadosAElegir - delegadosAsignados;
  let empatePendiente = false;
  let sindicatosEmpatados: number[] = [];

  if (delegadosRestantes > 0) {
    // Solo participaran las que pasaron barrera
    const candidaturasRestos = asignacionesV1.filter(c => c.votos >= barrera);
    // Ordenar de mayor a menor resto. Para desempatar, el PRD dice "Empate: Si hay empate exacto en el último resto, el sistema pausa la adjudicación automática... y habilita un botón para resolución manual"
    // También importa el orden de prioridad: "CSIF tiene prioridad absoluta (ID 1)". This means visual priority, but in a real tie, manual resolution is needed. I will sort by remainder desc.
    
    // Sort descending by remainder, then for exact same remainders we keep them.
    candidaturasRestos.sort((a, b) => {
      // Comparar restos flotantes con pequeña tolerancia
      if (Math.abs((b.resto || 0) - (a.resto || 0)) < 0.0001) return 0;
      return (b.resto || 0) - (a.resto || 0);
    });

    while (delegadosRestantes > 0 && candidaturasRestos.length > 0) {
      // Find the candidates with the highest remainder
      const highestResto = candidaturasRestos[0].resto || 0;
      const tiedCandidates = candidaturasRestos.filter(c => Math.abs((c.resto || 0) - highestResto) < 0.0001);

      if (tiedCandidates.length <= delegadosRestantes) {
        // We have enough remaining delegates to give to all tied candidates
        for (const candidate of tiedCandidates) {
          const index = asignacionesV1.findIndex(c => c.sindicato_id === candidate.sindicato_id);
          if (index !== -1) {
            asignacionesV1[index].delegadosRestos! += 1;
            asignacionesV1[index].delegadosTotales! += 1;
          }
          candidate.resto = -1; // Remove from next remainder check effectively
          delegadosRestantes -= 1;
        }
        // re-sort slightly so they are at the bottom
        candidaturasRestos.sort((a, b) => (b.resto || 0) - (a.resto || 0));
      } else {
        // We have a tie but not enough delegates!
        empatePendiente = true;
        sindicatosEmpatados = tiedCandidates.map(c => c.sindicato_id);
        break; // Stop automatic distribution
      }
    }
  }

  // Ensure priority order: CSIF (ID 1) should be first
  asignacionesV1.sort((a, b) => {
    if (a.sindicato_id === 1) return -1;
    if (b.sindicato_id === 1) return 1;
    // then sort by total delegates desc, votes desc
    if (b.delegadosTotales! !== a.delegadosTotales!) return b.delegadosTotales! - a.delegadosTotales!;
    return b.votos - a.votos;
  });

  return {
    candidaturas: asignacionesV1,
    empatePendiente,
    sindicatosEmpatados
  };
}
