import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

const tiposPedido = [
  {
    nome: 'Segunda via de certidão de nascimento',
    descricao: 'Emissão de segunda via de certidão de nascimento já registrada.',
  },
  {
    nome: 'Segunda via de certidão de casamento',
    descricao: 'Emissão de segunda via de certidão de casamento já registrada.',
  },
  {
    nome: 'Segunda via de certidão de óbito',
    descricao: 'Emissão de segunda via de certidão de óbito já registrada.',
  },
  {
    nome: 'Lavratura de escritura pública',
    descricao:
      'Elaboração e registro de escritura pública (compra e venda, doação, etc).',
  },
  {
    nome: 'Reconhecimento de firma',
    descricao: 'Reconhecimento de firma por autenticidade ou semelhança.',
  },
  {
    nome: 'Registro de imóvel',
    descricao: 'Registro de matrícula ou transferência de propriedade imobiliária.',
  },
  {
    nome: 'Autenticação de documento',
    descricao: 'Autenticação de cópia de documento conforme original.',
  },
  {
    nome: 'Procuração pública',
    descricao: 'Lavratura de procuração pública.',
  },
];

// Garante que todos os tipos de pedido existam (pode rodar várias vezes).
async function seedTiposPedido() {
  for (const tipo of tiposPedido) {
    await prisma.tipoPedido.upsert({
      where: { nome: tipo.nome },
      update: {},
      create: tipo,
    });
  }
  console.log(`Tipos de pedido garantidos: ${tiposPedido.length}.`);
}

// Cria UM pedido de exemplo, já com histórico, para o sistema abrir com dados.
// Só cria se o banco não tiver nenhum pedido, então rodar o seed de novo
// nunca duplica nem mexe em pedidos reais.
async function seedPedidoExemplo() {
  const totalPedidos = await prisma.pedido.count();
  if (totalPedidos > 0) {
    console.log('Já existem pedidos no banco: pedido de exemplo não criado.');
    return;
  }

  const tipo = await prisma.tipoPedido.findUnique({
    where: { nome: 'Segunda via de certidão de nascimento' },
  });
  if (!tipo) {
    throw new Error('Tipo de pedido do exemplo não encontrado.');
  }

  const ano = new Date().getFullYear();
  const sequencial = 1;
  const numeroProtocolo = `${ano}/${String(sequencial).padStart(6, '0')}`;

  await prisma.$transaction(async (tx) => {
    // O contador precisa refletir o pedido criado: sem isso, o próximo pedido
    // criado pela API tentaria usar o mesmo número e violaria a unicidade.
    await tx.contadorProtocolo.upsert({
      where: { ano },
      update: { ultimoNumero: sequencial },
      create: { ano, ultimoNumero: sequencial },
    });

    const pedido = await tx.pedido.create({
      data: {
        numeroProtocolo,
        ano,
        sequencial,
        tipoId: tipo.id,
        solicitante: 'Maria Oliveira',
        descricao:
          'Solicito a segunda via da certidão de nascimento para instruir processo de matrícula escolar.',
        prioridade: 'ALTA',
        status: 'EM_ANALISE',
      },
    });

    const agora = Date.now();
    await tx.movimentacao.createMany({
      data: [
        {
          pedidoId: pedido.id,
          estadoOrigem: null,
          estadoDestino: 'PROTOCOLADO',
          criadoEm: new Date(agora - 2 * 60 * 60 * 1000),
        },
        {
          pedidoId: pedido.id,
          estadoOrigem: 'PROTOCOLADO',
          estadoDestino: 'EM_ANALISE',
          criadoEm: new Date(agora - 60 * 60 * 1000),
        },
      ],
    });
  });

  console.log(`Pedido de exemplo criado: ${numeroProtocolo}.`);
}

async function main() {
  console.log('Iniciando seed...');
  await seedTiposPedido();
  await seedPedidoExemplo();
  console.log('Seed concluído.');
}

main()
  .catch((e) => {
    console.error('Erro ao executar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });