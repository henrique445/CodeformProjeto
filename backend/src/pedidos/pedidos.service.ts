import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { StatusPedido } from '../generated/prisma/client';

import {
  getTransicoesPossiveis,
  isTransicaoValida,
} from './pedido-state-machine';

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePedidoDto) {
    const tipoPedido = await this.prisma.tipoPedido.findUnique({
      where: {
        id: dto.tipoId,
      },
    });

    if (!tipoPedido) {
      throw new BadRequestException(
        'Tipo de pedido não encontrado.',
      );
    }

    const ano = new Date().getFullYear();

    return this.prisma.$transaction(async (tx) => {
      // Garante que existe um contador para o ano atual.
      await tx.$executeRaw`
        INSERT INTO "ContadorProtocolo" (ano, "ultimoNumero")
        VALUES (${ano}, 0)
        ON CONFLICT (ano) DO NOTHING
      `;

      // Bloqueia o contador durante a transação.
      // Isso evita que duas requisições recebam o mesmo número.
      const contadores = await tx.$queryRaw<
        { ultimoNumero: number }[]
      >`
        SELECT "ultimoNumero"
        FROM "ContadorProtocolo"
        WHERE ano = ${ano}
        FOR UPDATE
      `;

      const ultimoNumero = contadores[0].ultimoNumero;
      const proximoNumero = ultimoNumero + 1;

      // Atualiza o último número utilizado.
      await tx.$executeRaw`
        UPDATE "ContadorProtocolo"
        SET "ultimoNumero" = ${proximoNumero}
        WHERE ano = ${ano}
      `;

      const numeroProtocolo =
        `${ano}/${String(proximoNumero).padStart(6, '0')}`;

      // Cria o pedido.
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

      // Registra a criação do pedido no histórico.
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

  async findAll(filtros: {
    status?: StatusPedido;
    tipoId?: string;
    busca?: string;
  }) {
    return this.prisma.pedido.findMany({
      where: {
        status: filtros.status,
        tipoId: filtros.tipoId,

        OR: filtros.busca
          ? [
              {
                solicitante: {
                  contains: filtros.busca,
                  mode: 'insensitive',
                },
              },
              {
                numeroProtocolo: {
                  contains: filtros.busca,
                  mode: 'insensitive',
                },
              },
            ]
          : undefined,
      },

      include: {
        tipo: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: {
        id,
      },

      include: {
        tipo: true,

        movimentacoes: {
          orderBy: {
            criadoEm: 'asc',
          },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException(
        'Pedido não encontrado.',
      );
    }

    return pedido;
  }

  async updateStatus(
    id: string,
    novoStatus: StatusPedido,
  ) {
    const pedido = await this.prisma.pedido.findUnique({
      where: {
        id,
      },
    });

    if (!pedido) {
      throw new NotFoundException(
        'Pedido não encontrado.',
      );
    }

    // Verifica se a mudança de status é permitida.
    const transicaoValida = isTransicaoValida(
      pedido.status,
      novoStatus,
    );

    if (!transicaoValida) {
      const transicoesPossiveis =
        getTransicoesPossiveis(pedido.status);

      throw new BadRequestException(
        `Transição inválida de ${pedido.status} para ${novoStatus}. ` +
          `Transições possíveis: ${
            transicoesPossiveis.join(', ') ||
            'nenhuma (estado final)'
          }.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Atualiza o status do pedido.
      const pedidoAtualizado = await tx.pedido.update({
        where: {
          id,
        },

        data: {
          status: novoStatus,
        },
      });

      // Registra a mudança no histórico.
      await tx.movimentacao.create({
        data: {
          pedidoId: id,
          estadoOrigem: pedido.status,
          estadoDestino: novoStatus,
        },
      });

      return pedidoAtualizado;
    });
  }
}