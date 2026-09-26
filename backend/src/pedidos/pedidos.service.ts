import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { StatusPedido } from '../generated/prisma/client';
import { isTransicaoValida, getTransicoesPossiveis } from './pedido-state-machine';

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePedidoDto) {
    const tipo = await this.prisma.tipoPedido.findUnique({
      where: { id: dto.tipoId },
    });
    if (!tipo) {
      throw new BadRequestException('Tipo de pedido não encontrado.');
    }

    const ano = new Date().getFullYear();

    return this.prisma.$transaction(async (tx) => {
      // Garante que existe uma linha de controle para o ano corrente
      await tx.$executeRaw`
        INSERT INTO "ContadorProtocolo" (ano, "ultimoNumero")
        VALUES (${ano}, 0)
        ON CONFLICT (ano) DO NOTHING
      `;

      // Trava a linha do ano até o fim da transação (evita corrida)
      const linhas = await tx.$queryRaw<{ ultimoNumero: number }[]>`
        SELECT "ultimoNumero" FROM "ContadorProtocolo"
        WHERE ano = ${ano}
        FOR UPDATE
      `;

      const proximoNumero = linhas[0].ultimoNumero + 1;

      await tx.$executeRaw`
        UPDATE "ContadorProtocolo"
        SET "ultimoNumero" = ${proximoNumero}
        WHERE ano = ${ano}
      `;

      const numeroProtocolo = `${ano}/${String(proximoNumero).padStart(6, '0')}`;

      const pedido = await tx.pedido.create({
        data: {
          numeroProtocolo,
          ano,
          sequencial: proximoNumero,
          tipoId: dto.tipoId,
          solicitante: dto.solicitante,
          descricao: dto.descricao,
          prioridade: dto.prioridade,
          status: 'PROTOCOLADO',
        },
      });

      await tx.movimentacao.create({
        data: {
          pedidoId: pedido.id,
          estadoOrigem: null,
          estadoDestino: 'PROTOCOLADO',
        },
      });

      return pedido;
    });
  }

  async findAll(filtros: { status?: StatusPedido; tipoId?: string; busca?: string }) {
    return this.prisma.pedido.findMany({
      where: {
        status: filtros.status,
        tipoId: filtros.tipoId,
        OR: filtros.busca
          ? [
              { solicitante: { contains: filtros.busca, mode: 'insensitive' } },
              { numeroProtocolo: { contains: filtros.busca, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: { tipo: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        tipo: true,
        movimentacoes: { orderBy: { criadoEm: 'asc' } },
      },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado.');
    }
    return pedido;
  }

  async updateStatus(id: string, novoStatus: StatusPedido) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    if (!isTransicaoValida(pedido.status, novoStatus)) {
      throw new BadRequestException(
        `Transição inválida de ${pedido.status} para ${novoStatus}. ` +
          `Transições possíveis: ${getTransicoesPossiveis(pedido.status).join(', ') || 'nenhuma (estado final)'}.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const atualizado = await tx.pedido.update({
        where: { id },
        data: { status: novoStatus },
      });

      await tx.movimentacao.create({
        data: {
          pedidoId: id,
          estadoOrigem: pedido.status,
          estadoDestino: novoStatus,
        },
      });

      return atualizado;
    });
  }
}