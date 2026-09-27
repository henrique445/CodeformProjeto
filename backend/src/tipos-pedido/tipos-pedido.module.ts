import { Module } from '@nestjs/common';
import { TiposPedidoController } from './tipos-pedido.controller';
import { TiposPedidoService } from './tipos-pedido.service';

@Module({
  controllers: [TiposPedidoController],
  providers: [TiposPedidoService],
})
export class TiposPedidoModule {}