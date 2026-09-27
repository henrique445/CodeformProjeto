import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { TiposPedidoModule } from './tipos-pedido/tipos-pedido.module';

@Module({
  imports: [PrismaModule, PedidosModule, TiposPedidoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}