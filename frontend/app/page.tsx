'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  listarPedidos,
  listarTiposPedido,
  Pedido,
  TipoPedido,
  StatusPedido,
} from './lib/api';

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

export default function Home() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [tipos, setTipos] = useState<TipoPedido[]>([]);
  const [status, setStatus] = useState('');
  const [tipoId, setTipoId] = useState('');
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    listarTiposPedido().then(setTipos).catch(() => {});
  }, []);

  useEffect(() => {
    setCarregando(true);
    setErro('');
    listarPedidos({ status, tipoId, busca })
      .then(setPedidos)
      .catch(() => setErro('Não foi possível carregar os pedidos.'))
      .finally(() => setCarregando(false));
  }, [status, tipoId, busca]);

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Protocolo de Pedidos
          </h1>
          <Link
            href="/novo"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            + Novo Pedido
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar por solicitante ou protocolo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 min-w-[240px] rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={tipoId}
            onChange={(e) => setTipoId(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Todos os tipos</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {carregando ? (
            <p className="p-6 text-sm text-zinc-500">Carregando...</p>
          ) : erro ? (
            <p className="p-6 text-sm text-red-600">{erro}</p>
          ) : pedidos.length === 0 ? (
            <p className="p-6 text-sm text-zinc-500">
              Nenhum pedido encontrado.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Protocolo</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Solicitante</th>
                  <th className="px-4 py-3">Prioridade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pedidos.map((pedido) => (
                  <tr
                    key={pedido.id}
                    className="cursor-pointer hover:bg-zinc-50"
                    onClick={() =>
                      (window.location.href = `/pedidos/${pedido.id}`)
                    }
                  >
                    <td className="px-4 py-3 font-mono text-zinc-900">
                      {pedido.numeroProtocolo}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {pedido.tipo?.nome ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {pedido.solicitante}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {pedido.prioridade}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_CORES[pedido.status]}`}
                      >
                        {STATUS_LABELS[pedido.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(pedido.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}