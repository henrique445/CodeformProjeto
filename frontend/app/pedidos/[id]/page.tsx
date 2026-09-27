'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { buscarPedido, atualizarStatus, Pedido, StatusPedido } from '../../lib/api';

const STATUS_LABELS: Record<StatusPedido, string> = {
  PROTOCOLADO: 'Protocolado',
  EM_ANALISE: 'Em análise',
  EM_EXIGENCIA: 'Em exigência',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

const STATUS_CORES: Record<StatusPedido, string> = {
  PROTOCOLADO: 'bg-blue-100 text-blue-800',
  EM_ANALISE: 'bg-yellow-100 text-yellow-800',
  EM_EXIGENCIA: 'bg-orange-100 text-orange-800',
  CONCLUIDO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-zinc-200 text-zinc-600',
};

// Espelha o mapa de transições do backend, só pra saber quais botões mostrar.
// A validação de verdade continua sendo feita no backend.
const TRANSICOES: Record<StatusPedido, StatusPedido[]> = {
  PROTOCOLADO: ['EM_ANALISE', 'CANCELADO'],
  EM_ANALISE: ['EM_EXIGENCIA', 'CONCLUIDO', 'CANCELADO'],
  EM_EXIGENCIA: ['EM_ANALISE', 'CANCELADO'],
  CONCLUIDO: [],
  CANCELADO: [],
};

export default function DetalhePedido({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizando, setAtualizando] = useState(false);

  function carregar() {
    setCarregando(true);
    buscarPedido(id)
      .then(setPedido)
      .catch(() => setErro('Pedido não encontrado.'))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
  }, [id]);

  async function handleTransicao(novoStatus: StatusPedido) {
    setAtualizando(true);
    setErro('');
    try {
      await atualizarStatus(id, novoStatus);
      carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao atualizar status.');
    } finally {
      setAtualizando(false);
    }
  }

  if (carregando) {
    return <div className="p-8 text-sm text-zinc-500">Carregando...</div>;
  }

  if (!pedido) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">{erro || 'Pedido não encontrado.'}</p>
        <Link href="/" className="mt-2 inline-block text-sm text-zinc-500 underline">
          Voltar
        </Link>
      </div>
    );
  }

  const transicoesPossiveis = TRANSICOES[pedido.status];

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-800">
          ← Voltar
        </Link>

        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">
            {pedido.numeroProtocolo}
          </h1>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_CORES[pedido.status]}`}
          >
            {STATUS_LABELS[pedido.status]}
          </span>
        </div>

        {erro && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}

        <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-white p-6">
          <div>
            <p className="text-xs uppercase text-zinc-500">Tipo</p>
            <p className="text-sm text-zinc-900">{pedido.tipo?.nome}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Solicitante</p>
            <p className="text-sm text-zinc-900">{pedido.solicitante}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Prioridade</p>
            <p className="text-sm text-zinc-900">{pedido.prioridade}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Criado em</p>
            <p className="text-sm text-zinc-900">
              {new Date(pedido.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs uppercase text-zinc-500">Descrição</p>
            <p className="text-sm text-zinc-900">{pedido.descricao}</p>
          </div>
        </div>

        {transicoesPossiveis.length > 0 && (
          <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6">
            <p className="mb-3 text-sm font-medium text-zinc-700">
              Mudar status para:
            </p>
            <div className="flex flex-wrap gap-2">
              {transicoesPossiveis.map((status) => (
                <button
                  key={status}
                  disabled={atualizando}
                  onClick={() => handleTransicao(status)}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="mb-3 text-sm font-medium text-zinc-700">
            Histórico de movimentações
          </p>
          <div className="space-y-3">
            {pedido.movimentacoes?.map((mov) => (
              <div key={mov.id} className="flex items-center gap-3 text-sm">
                <span className="text-zinc-400">
                  {new Date(mov.criadoEm).toLocaleString('pt-BR')}
                </span>
                <span className="text-zinc-600">
                  {mov.estadoOrigem ? STATUS_LABELS[mov.estadoOrigem] : 'Criado'}
                  {' → '}
                  <strong>{STATUS_LABELS[mov.estadoDestino]}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}