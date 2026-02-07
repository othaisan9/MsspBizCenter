import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsUUID, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { TaskStatus, TaskPriority } from '@msspbiz/shared';

export class QueryTaskDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '작업 상태 필터',
    enum: TaskStatus,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: '작업 우선순위 필터',
    enum: TaskPriority,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: '담당자 ID 필터 (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({
    description: '주차 번호 필터 (1-53)',
    example: 6,
    minimum: 1,
    maximum: 53,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(53)
  weekNumber?: number;

  @ApiPropertyOptional({
    description: '연도 필터',
    example: 2026,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({
    description: '검색어 (제목/설명)',
    example: 'API 개발',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
