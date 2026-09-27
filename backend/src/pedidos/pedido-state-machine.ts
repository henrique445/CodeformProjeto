import { StatusPedido } from '../generated/prisma/client';

/**
 * Define quais status podem ser usados depois de cada status atual.
 *
 * Exemplo:
 * PROTOCOLADO pode virar EM_ANALISE ou CANCELADO.
 */
const TRANSICOES_VALIDAS: Record<StatusPedido, StatusPedido[]> = {
  PROTOCOLADO: [
    'EM_ANALISE',
    'CANCELADO'],

  EM_ANALISE: [
    'EM_EXIGENCIA',
    'CONCLUIDO',
    'CANCELADO',
  ],

  EM_EXIGENCIA: [
    'EM_ANALISE',
    'CANCELADO',
  ],

  CONCLUIDO: [],

  CANCELADO: [],
};

/**
 * Verifica se uma mudança de status é permitida.
 */
export function isTransicaoValida(
  statusAtual: StatusPedido,
  novoStatus: StatusPedido,
): boolean {
  const statusPermitidos = TRANSICOES_VALIDAS[statusAtual];

  return statusPermitidos.includes(novoStatus);
}

/**
 * Retorna todos os status para os quais o pedido
 * pode ser alterado a partir do status atual.
 */
export function getTransicoesPossiveis(
  statusAtual: StatusPedido,
): StatusPedido[] {
  return TRANSICOES_VALIDAS[statusAtual];
}