import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { StatusPedido } from '../generated/prisma/client';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  create(@Body() dto: CreatePedidoDto) {
    return this.pedidosService.create(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: StatusPedido,
    @Query('tipoId') tipoId?: string,
    @Query('busca') busca?: string,
  ) {
    return this.pedidosService.findAll({
      status,
      tipoId,
      busca,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pedidosService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.pedidosService.updateStatus(id, dto.status);
  }
}