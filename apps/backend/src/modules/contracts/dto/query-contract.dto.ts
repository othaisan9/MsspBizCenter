import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ContractType, ContractStatus } from '@msspbiz/shared';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryContractDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '계약 유형 필터',
    enum: ContractType,
  })
  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @ApiPropertyOptional({
    description: '계약 상태 필터',
    enum: ContractStatus,
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @ApiPropertyOptional({
    description: '검색어 (제목, 계약번호, 당사자)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '시작일 범위 시작',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({
    description: '시작일 범위 종료',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({
    description: '만료 예정 필터 (N일 이내 만료)',
    example: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expiringWithinDays?: number;
}
