'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { criarPedido, listarTiposPedido, TipoPedido } from '../lib/api';

export default function NovoPedido() {
  const router = useRouter();
  const [tipos, setTipos] = useState<TipoPedido[]>([]);
  const [tipoId, setTipoId] = useState('');
  const [solicitante, setSolicitante] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState('NORMAL');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    listarTiposPedido().then(setTipos).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const pedido = await criarPedido({
        tipoId,
        solicitante,
        descricao,
        prioridade,
      });
      router.push(`/pedidos/${pedido.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar pedido.');
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="mx-auto max-w-xl">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-800"
        >
          ← Voltar
        </Link>
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900">
          Novo Pedido
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Tipo de pedido
            </label>
            <select
              required
              value={tipoId}
              onChange={(e) => setTipoId(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm bg-white text-zinc-900"
            >
              <option value="">Selecione...</option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Solicitante
            </label>
            <input
              required
              type="text"
              value={solicitante}
              onChange={(e) => setSolicitante(e.target.value)}
              placeholder="Nome completo"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm bg-white text-zinc-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 bg-white text-zinc-900">
              Descrição
            </label>
            <textarea
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              placeholder="Detalhes do pedido..."
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm bg-white text-zinc-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Prioridade
            </label>
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm bg-white text-zinc-900"
            >
              <option value="BAIXA">Baixa</option>
              <option value="NORMAL">Normal</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>

          {erro && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {enviando ? 'Criando...' : 'Criar Pedido'}
          </button>
        </form>
      </div>
    </div>
  );
}