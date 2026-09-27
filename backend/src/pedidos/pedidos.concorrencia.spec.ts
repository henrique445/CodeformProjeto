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

    // Garante que existe um tipo de pedido para usar nos testes
    const tipo = await prisma.tipoPedido.upsert({
      where: { nome: '__TIPO_TESTE_CONCORRENCIA__' },
      update: {},
      create: {
        nome: '__TIPO_TESTE_CONCORRENCIA__',
        descricao: 'Usado apenas em testes automatizados.',
      },
    });
    tipoId = tipo.id;
  });

  afterAll(async () => {
    // Limpa os dados criados pelo teste, para não sujar o banco
    await prisma.movimentacao.deleteMany({
      where: { pedido: { tipoId } },
    });
    await prisma.pedido.deleteMany({ where: { tipoId } });
    await prisma.tipoPedido.delete({ where: { id: tipoId } });
    await prisma.$disconnect();
  });

  it('nao gera numeros de protocolo duplicados sob concorrencia', async () => {
    const QUANTIDADE = 20;

    // Dispara N criações de pedido "ao mesmo tempo", simulando
    // múltiplos usuários protocolando pedidos simultaneamente.
    const promessas = Array.from({ length: QUANTIDADE }, (_, i) =>
      service.create({
        tipoId,
        solicitante: `Solicitante Teste ${i}`,
        descricao: 'Pedido criado em teste de concorrencia',
      }),
    );

    const pedidosCriados = await Promise.all(promessas);

    const numerosProtocolo = pedidosCriados.map((p) => p.numeroProtocolo);
    const numerosUnicos = new Set(numerosProtocolo);

    // Se algum número se repetiu, o Set vai ter menos elementos
    // que o array original — é isso que o teste verifica.
    expect(numerosUnicos.size).toBe(QUANTIDADE);
  }, 15000); // timeout maior, já que são 20 operações reais no banco
});