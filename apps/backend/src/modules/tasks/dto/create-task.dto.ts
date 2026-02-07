import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsUUID,
  IsDateString,
  IsNumber,
  IsArray,
} from 'class-validator';
import { TaskStatus, TaskPriority } from '@msspbiz/shared';

export class CreateTaskDto {
  @ApiProperty({
    description: '작업 제목',
    example: 'API 개발 및 테스트',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: '작업 상세 설명',
    example: 'Task CRUD API를 개발하고 단위 테스트를 작성합니다.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '주차 번호 (1-53)',
    example: 6,
    minimum: 1,
    maximum: 53,
  })
  @IsInt()
  @Min(1)
  @Max(53)
  weekNumber: number;

  @ApiProperty({
    description: '연도',
    example: 2026,
  })
  @IsInt()
  year: number;

  @ApiPropertyOptional({
    description: '작업 상태',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: '작업 우선순위',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: '담당자 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({
    description: '마감일 (ISO 8601 형식)',
    example: '2026-02-14T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: '예상 소요 시간 (시간 단위)',
    example: 8.5,
  })
  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @ApiPropertyOptional({
    description: '태그 목록',
    example: ['backend', 'api', 'high-priority'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: '상위 작업 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  parentTaskId?: string;
}
