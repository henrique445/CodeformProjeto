import { Test, TestingModule } from '@nestjs/testing';
import { PedidosService } from './pedidos.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PedidosService - concorrência na numeração', () => {
  let service: PedidosService;
  let prisma: PrismaService;
  let tipoId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PedidosService, PrismaService],
    }).compile();

    service = module.get<PedidosService>(PedidosService);
    prisma = module.get<PrismaService>(PrismaService);

    // Garante que existe um tipo de pedido para os testes.
    const tipoPedido = await prisma.tipoPedido.upsert({
      where: {
        nome: '__TIPO_TESTE_CONCORRENCIA__',
      },
      update: {},
      create: {
        nome: '__TIPO_TESTE_CONCORRENCIA__',
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
    'não gera números de protocolo duplicados sob concorrência',
    async () => {
      const QUANTIDADE_DE_PEDIDOS = 20;

      // Cria vários pedidos simultaneamente,
      // simulando diferentes usuários protocolando ao mesmo tempo.
      const promessas = Array.from(
        { length: QUANTIDADE_DE_PEDIDOS },
        (_, indice) =>
          service.create({
            tipoId,
            solicitante: `Solicitante Teste ${indice}`,
            descricao: 'Pedido criado em teste de concorrência.',
          }),
      );

      const pedidosCriados = await Promise.all(promessas);

      // Obtém todos os números de protocolo gerados.
      const numerosDeProtocolo = pedidosCriados.map(
        (pedido) => pedido.numeroProtocolo,
      );

      // Set remove valores duplicados.
      const numerosUnicos = new Set(numerosDeProtocolo);

      // Todos os pedidos devem possuir um número diferente.
      expect(numerosUnicos.size).toBe(QUANTIDADE_DE_PEDIDOS);
    },
    15000,
  );
});