import { IsEnum } from 'class-validator';

export enum StatusDto {
  PROTOCOLADO = 'PROTOCOLADO',
  EM_ANALISE = 'EM_ANALISE',
  EM_EXIGENCIA = 'EM_EXIGENCIA',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO',
}

export class UpdateStatusDto {
  @IsEnum(StatusDto)
  status: StatusDto;
}