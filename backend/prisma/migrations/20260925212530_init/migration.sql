-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('PROTOCOLADO', 'EM_ANALISE', 'EM_EXIGENCIA', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateTable
CREATE TABLE "TipoPedido" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipoPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "numeroProtocolo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "sequencial" INTEGER NOT NULL,
    "tipoId" TEXT NOT NULL,
    "solicitante" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" "Prioridade" NOT NULL DEFAULT 'NORMAL',
    "status" "StatusPedido" NOT NULL DEFAULT 'PROTOCOLADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimentacao" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "estadoOrigem" "StatusPedido",
    "estadoDestino" "StatusPedido" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContadorProtocolo" (
    "ano" INTEGER NOT NULL,
    "ultimoNumero" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContadorProtocolo_pkey" PRIMARY KEY ("ano")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoPedido_nome_key" ON "TipoPedido"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_numeroProtocolo_key" ON "Pedido"("numeroProtocolo");

-- CreateIndex
CREATE INDEX "Pedido_status_idx" ON "Pedido"("status");

-- CreateIndex
CREATE INDEX "Pedido_tipoId_idx" ON "Pedido"("tipoId");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_ano_sequencial_key" ON "Pedido"("ano", "sequencial");

-- CreateIndex
CREATE INDEX "Movimentacao_pedidoId_idx" ON "Movimentacao"("pedidoId");

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "TipoPedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacao" ADD CONSTRAINT "Movimentacao_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
