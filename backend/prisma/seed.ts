import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

const prisma = new PrismaClient({
  adapter,
});

const tiposPedido = [
  {
    nome: 'Segunda via de certidão de nascimento',
    descricao:
      'Emissão de segunda via de certidão de nascimento já registrada.',
  },
  {
    nome: 'Segunda via de certidão de casamento',
    descricao:
      'Emissão de segunda via de certidão de casamento já registrada.',
  },
  {
    nome: 'Segunda via de certidão de óbito',
    descricao:
      'Emissão de segunda via de certidão de óbito já registrada.',
  },
  {
    nome: 'Lavratura de escritura pública',
    descricao:
      'Elaboração e registro de escritura pública (compra e venda, doação, etc.).',
  },
  {
    nome: 'Reconhecimento de firma',
    descricao:
      'Reconhecimento de firma por autenticidade ou semelhança.',
  },
  {
    nome: 'Registro de imóvel',
    descricao:
      'Registro de matrícula ou transferência de propriedade imobiliária.',
  },
  {
    nome: 'Autenticação de documento',
    descricao:
      'Autenticação de cópia de documento conforme original.',
  },
  {
    nome: 'Procuração pública',
    descricao: 'Lavratura de procuração pública.',
  },
];

async function main() {
  console.log('Iniciando seed de tipos de pedido...');

  // Garante que todos os tipos de pedido existam no banco.
  for (const tipoPedido of tiposPedido) {
    await prisma.tipoPedido.upsert({
      where: {
        nome: tipoPedido.nome,
      },

      // Se já existir, não altera os dados.
      update: {},

      // Se não existir, cria o tipo.
      create: tipoPedido,
    });
  }

  console.log(
    `Seed concluído: ${tiposPedido.length} tipos de pedido garantidos.`,
  );
}

main()
  .catch((erro) => {
    console.error('Erro ao executar o seed:', erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });