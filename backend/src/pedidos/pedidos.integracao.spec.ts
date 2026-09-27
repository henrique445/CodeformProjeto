import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PedidosService - fluxo de integracao do CRUD', () => {
  let service: PedidosService;
  let prisma: PrismaService;
  let tipoId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PedidosService, PrismaService],
    }).compile();

    service = module.get<PedidosService>(PedidosService);
    prisma = module.get<PrismaService>(PrismaService);

    const tipo = await prisma.tipoPedido.upsert({
      where: { nome: '__TIPO_TESTE_INTEGRACAO__' },
      update: {},
      create: {
        nome: '__TIPO_TESTE_INTEGRACAO__',
        descricao: 'Usado apenas em testes automatizados.',
      },
    });
    tipoId = tipo.id;
  });

  afterAll(async () => {
    await prisma.movimentacao.deleteMany({ where: { pedido: { tipoId } } });
    await prisma.pedido.deleteMany({ where: { tipoId } });
    await prisma.tipoPedido.delete({ where: { id: tipoId } });
    await prisma.$disconnect();
  });

  it('cria um pedido com numero de protocolo e status inicial corretos', async () => {
    const pedido = await service.create({
      tipoId,
      solicitante: 'Maria Teste',
      descricao: 'Pedido de teste de integracao',
    });

    expect(pedido.numeroProtocolo).toMatch(/^\d{4}\/\d{6}$/);
    expect(pedido.status).toBe('PROTOCOLADO');
    expect(pedido.solicitante).toBe('Maria Teste');
  });

  it('busca um pedido por id, incluindo tipo e historico de movimentacoes', async () => {
    const criado = await service.create({
      tipoId,
      solicitante: 'Carlos Teste',
      descricao: 'Outro pedido de teste',
    });

    const encontrado = await service.findOne(criado.id);

    expect(encontrado.id).toBe(criado.id);
    expect(encontrado.tipo?.id).toBe(tipoId);
    expect(encontrado.movimentacoes).toHaveLength(1);
    expect(encontrado.movimentacoes[0].estadoDestino).toBe('PROTOCOLADO');
  });

  it('lanca NotFoundException ao buscar um pedido inexistente', async () => {
    await expect(
      service.findOne('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow(NotFoundException);
  });

  it('lista pedidos filtrando por tipoId', async () => {
    const pedidos = await service.findAll({ tipoId });
    expect(pedidos.length).toBeGreaterThan(0);
    expect(pedidos.every((p) => p.tipoId === tipoId)).toBe(true);
  });

  it('atualiza o status quando a transicao e valida e registra no historico', async () => {
    const criado = await service.create({
      tipoId,
      solicitante: 'Ana Teste',
      descricao: 'Pedido para testar transicao',
    });

    const atualizado = await service.updateStatus(criado.id, 'EM_ANALISE');
    expect(atualizado.status).toBe('EM_ANALISE');

    const buscado = await service.findOne(criado.id);
    expect(buscado.movimentacoes).toHaveLength(2);
  });

  it('lanca BadRequestException ao tentar uma transicao invalida', async () => {
    const criado = await service.create({
      tipoId,
      solicitante: 'Pedro Teste',
      descricao: 'Pedido para testar transicao invalida',
    });

    await expect(
      service.updateStatus(criado.id, 'CONCLUIDO'),
    ).rejects.toThrow(BadRequestException);
  });
});