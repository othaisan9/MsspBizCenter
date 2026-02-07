import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  IsUUID,
  MaxLength,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContractType, ContractStatus } from '@msspbiz/shared';

class PartyBContactDto {
  @ApiPropertyOptional({ description: '담당자 이름' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: '담당자 이메일' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: '담당자 전화번호' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;
}

export class CreateContractDto {
  @ApiProperty({ description: '계약 제목', example: '보안 서비스 계약' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: '계약 번호', example: 'CT-2026-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contractNumber?: string;

  @ApiProperty({
    description: '계약 유형',
    enum: ContractType,
    example: ContractType.SERVICE,
  })
  @IsEnum(ContractType)
  contractType: ContractType;

  @ApiProperty({ description: '계약 당사자 A (우리 측)', example: '(주)오타이산' })
  @IsString()
  @MaxLength(255)
  partyA: string;

  @ApiProperty({ description: '계약 당사자 B (상대방)', example: 'ABC Corporation' })
  @IsString()
  @MaxLength(255)
  partyB: string;

  @ApiPropertyOptional({
    description: '상대방 연락처 정보',
    type: PartyBContactDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PartyBContactDto)
  partyBContact?: PartyBContactDto;

  @ApiProperty({ description: '계약 시작일', example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: '계약 종료일', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: '계약 금액 (평문, 자동 암호화됨)',
    example: 50000000,
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: '통화', example: 'KRW', default: 'KRW' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ description: '결제 조건', example: '월 말일 지급' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({
    description: '계약 상태',
    enum: ContractStatus,
    default: ContractStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @ApiPropertyOptional({ description: '자동 갱신 여부', example: false })
  @IsOptional()
  @IsBoolean()
  autoRenewal?: boolean;

  @ApiPropertyOptional({ description: '갱신 통보 기한 (일)', example: 30 })
  @IsOptional()
  @IsInt()
  renewalNoticeDays?: number;

  @ApiPropertyOptional({ description: '계약 내용 요약' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '상위 계약 ID (갱신 시)' })
  @IsOptional()
  @IsUUID()
  parentContractId?: string;
}
