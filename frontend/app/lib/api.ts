const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type StatusPedido =
  | 'PROTOCOLADO'
  | 'EM_ANALISE'
  | 'EM_EXIGENCIA'
  | 'CONCLUIDO'
  | 'CANCELADO';

export interface TipoPedido {
  id: string;
  nome: string;
  descricao: string | null;
}

export interface Movimentacao {
  id: string;
  estadoOrigem: StatusPedido | null;
  estadoDestino: StatusPedido;
  criadoEm: string;
}

export interface Pedido {
  id: string;
  numeroProtocolo: string;
  ano: number;
  sequencial: number;
  tipoId: string;
  solicitante: string;
  descricao: string;
  prioridade: string;
  status: StatusPedido;
  createdAt: string;
  updatedAt: string;
  tipo?: TipoPedido;
  movimentacoes?: Movimentacao[];
}

export async function listarPedidos(filtros?: {
  status?: string;
  tipoId?: string;
  busca?: string;
}): Promise<Pedido[]> {
  const params = new URLSearchParams();
  if (filtros?.status) params.set('status', filtros.status);
  if (filtros?.tipoId) params.set('tipoId', filtros.tipoId);
  if (filtros?.busca) params.set('busca', filtros.busca);

  const res = await fetch(`${API_URL}/pedidos?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Erro ao carregar pedidos.');
  return res.json();
}

export async function buscarPedido(id: string): Promise<Pedido> {
  const res = await fetch(`${API_URL}/pedidos/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Pedido não encontrado.');
  return res.json();
}

export async function listarTiposPedido(): Promise<TipoPedido[]> {
  const res = await fetch(`${API_URL}/tipos-pedido`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Erro ao carregar tipos de pedido.');
  return res.json();
}

export async function criarPedido(dados: {
  tipoId: string;
  solicitante: string;
  descricao: string;
  prioridade?: string;
}): Promise<Pedido> {
  const res = await fetch(`${API_URL}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    const erro = await res.json();
    throw new Error(erro.message || 'Erro ao criar pedido.');
  }
  return res.json();
}

export async function atualizarStatus(
  id: string,
  status: StatusPedido,
): Promise<Pedido> {
  const res = await fetch(`${API_URL}/pedidos/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const erro = await res.json();
    throw new Error(erro.message || 'Erro ao atualizar status.');
  }
  return res.json();
}