import { StatusPedido } from '../generated/prisma/client';

// Mapa central de transições válidas. Qualquer mudança de status
// passa por aqui — é a única fonte de verdade sobre o que pode virar o quê.
const TRANSICOES_VALIDAS: Record<StatusPedido, StatusPedido[]> = {
  PROTOCOLADO: ['EM_ANALISE', 'CANCELADO'],
  EM_ANALISE: ['EM_EXIGENCIA', 'CONCLUIDO', 'CANCELADO'],
  EM_EXIGENCIA: ['EM_ANALISE', 'CANCELADO'],
  CONCLUIDO: [],
  CANCELADO: [],
};

export function isTransicaoValida(
  origem: StatusPedido,
  destino: StatusPedido,
): boolean {
  return TRANSICOES_VALIDAS[origem]?.includes(destino) ?? false;
}

export function getTransicoesPossiveis(origem: StatusPedido): StatusPedido[] {
  return TRANSICOES_VALIDAS[origem] ?? [];
}