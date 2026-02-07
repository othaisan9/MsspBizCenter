import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ActionItemStatus } from '@msspbiz/shared';

export class UpdateActionItemDto {
  @ApiPropertyOptional({ description: 'Action Item 제목' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: '담당자 ID' })
  @IsOptional()
  @IsUUID('4')
  assigneeId?: string;

  @ApiPropertyOptional({ description: '마감일 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: '상태',
    enum: ActionItemStatus,
  })
  @IsOptional()
  @IsEnum(ActionItemStatus)
  status?: ActionItemStatus;
}
