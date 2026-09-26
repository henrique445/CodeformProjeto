import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum PrioridadeDto {
  BAIXA = 'BAIXA',
  NORMAL = 'NORMAL',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE',
}

export class CreatePedidoDto {
  @IsUUID()
  tipoId: string;

  @IsString()
  @IsNotEmpty()
  solicitante: string;

  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsOptional()
  @IsEnum(PrioridadeDto)
  prioridade?: PrioridadeDto;
}