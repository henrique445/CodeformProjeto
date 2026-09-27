import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { PedidosService } from './pedidos.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PedidosService - fluxo de integração do CRUD', () => {
  let service: PedidosService;
  let prisma: PrismaService;
  let tipoId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PedidosService, PrismaService],
    }).compile();

    service = module.get<PedidosService>(PedidosService);
    prisma = module.get<PrismaService>(PrismaService);

    // Cria ou reutiliza um tipo de pedido exclusivo para os testes.
    const tipoPedido = await prisma.tipoPedido.upsert({
      where: {
        nome: '__TIPO_TESTE_INTEGRACAO__',
      },
      update: {},
      create: {
        nome: '__TIPO_TESTE_INTEGRACAO__',
        descricao: 'Usado apenas em testes automatizados.',
      },
    });

    tipoId = tipoPedido.id;
  });

  afterAll(async () => {
    // Remove os dados criados pelos testes.
    await prisma.movimentacao.deleteMany({
      where: {
        pedido: {
          tipoId,
        },
      },
    });

    await prisma.pedido.deleteMany({
      where: {
        tipoId,
      },
    });

    await prisma.tipoPedido.delete({
      where: {
        id: tipoId,
      },
    });

    await prisma.$disconnect();
  });

  it(
    'cria um pedido com número de protocolo e status inicial corretos',
    async () => {
      const pedido = await service.create({
        tipoId,
        solicitante: 'Maria Teste',
        descricao: 'Pedido de teste de integração',
      });

      expect(pedido.numeroProtocolo).toMatch(/^\d{4}\/\d{6}$/);
      expect(pedido.status).toBe('PROTOCOLADO');
      expect(pedido.solicitante).toBe('Maria Teste');
    },
  );

  it(
    'busca um pedido por id, incluindo tipo e histórico de movimentações',
    async () => {
      const pedidoCriado = await service.create({
        tipoId,
        solicitante: 'Carlos Teste',
        descricao: 'Outro pedido de teste',
      });

      const pedidoEncontrado = await service.findOne(pedidoCriado.id);

      expect(pedidoEncontrado.id).toBe(pedidoCriado.id);
      expect(pedidoEncontrado.tipo?.id).toBe(tipoId);
      expect(pedidoEncontrado.movimentacoes).toHaveLength(1);
      expect(
        pedidoEncontrado.movimentacoes[0].estadoDestino,
      ).toBe('PROTOCOLADO');
    },
  );

  it(
    'lança NotFoundException ao buscar um pedido inexistente',
    async () => {
      const idInexistente =
        '00000000-0000-0000-0000-000000000000';

      await expect(
        service.findOne(idInexistente),
      ).rejects.toThrow(NotFoundException);
    },
  );

  it('lista pedidos filtrando por tipoId', async () => {
    const pedidos = await service.findAll({
      tipoId,
    });

    expect(pedidos.length).toBeGreaterThan(0);
    expect(
      pedidos.every((pedido) => pedido.tipoId === tipoId),
    ).toBe(true);
  });

  it(
    'atualiza o status quando a transição é válida e registra no histórico',
    async () => {
      const pedidoCriado = await service.create({
        tipoId,
        solicitante: 'Ana Teste',
        descricao: 'Pedido para testar transição',
      });

      const pedidoAtualizado = await service.updateStatus(
        pedidoCriado.id,
        'EM_ANALISE',
      );

      expect(pedidoAtualizado.status).toBe('EM_ANALISE');

      const pedidoEncontrado = await service.findOne(
        pedidoCriado.id,
      );

      expect(pedidoEncontrado.movimentacoes).toHaveLength(2);
    },
  );

  it(
    'lança BadRequestException ao tentar uma transição inválida',
    async () => {
      const pedidoCriado = await service.create({
        tipoId,
        solicitante: 'Pedro Teste',
        descricao: 'Pedido para testar transição inválida',
      });

      await expect(
        service.updateStatus(
          pedidoCriado.id,
          'CONCLUIDO',
        ),
      ).rejects.toThrow(BadRequestException);
    },
  );
});