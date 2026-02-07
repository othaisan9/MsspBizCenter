import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateActionItemDto {
  @ApiProperty({ description: 'Action Item 제목', example: 'API 문서 작성' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: '담당자 ID', example: 'uuid-123' })
  @IsOptional()
  @IsUUID('4')
  assigneeId?: string;

  @ApiPropertyOptional({
    description: '마감일 (ISO 8601)',
    example: '2026-02-14T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
