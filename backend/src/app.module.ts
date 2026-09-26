import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PedidosModule } from './pedidos/pedidos.module';

@Module({
  imports: [PrismaModule, PedidosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}