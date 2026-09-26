import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
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
    descricao: 'Elaboração e registro de escritura pública (compra e venda, doação, etc).',
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

async function main() {
  console.log('Iniciando seed de tipos de pedido...');

  for (const tipo of tiposPedido) {
    await prisma.tipoPedido.upsert({
      where: { nome: tipo.nome },
      update: {},
      create: tipo,
    });
  }

  console.log(`Seed concluído: ${tiposPedido.length} tipos de pedido garantidos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });