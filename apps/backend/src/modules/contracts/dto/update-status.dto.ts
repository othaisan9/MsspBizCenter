import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ContractStatus } from '@msspbiz/shared';

export class UpdateStatusDto {
  @ApiProperty({
    description: '변경할 계약 상태',
    enum: ContractStatus,
    example: ContractStatus.ACTIVE,
  })
  @IsEnum(ContractStatus)
  status: ContractStatus;
}
