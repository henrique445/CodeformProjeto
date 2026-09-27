import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TiposPedidoService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tipoPedido.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }
}
