import { IsString, IsOptional, IsUUID, IsInt, Min, Max, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateTaskDescDto {
  @ApiProperty({ description: '업무 제목', example: 'API 서버 성능 개선' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: '태그 (배열)', example: ['backend', 'performance'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '우선순위', example: 'high' })
  @IsOptional()
  @IsString()
  priority?: string;
}

export class SummarizeMeetingDto {
  @ApiProperty({ description: '회의록 ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  meetingId: string;
}

export class ExtractActionItemsDto {
  @ApiProperty({ description: '회의록 ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  meetingId: string;
}

export class GenerateMeetingTemplateDto {
  @ApiProperty({ description: '회의 제목', example: '주간 스프린트 회의' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: '회의 유형', example: '정기회의' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: '참석자 수', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  attendeeCount?: number;
}

export class WeeklyReportDto {
  @ApiProperty({ description: '연도', example: 2026 })
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiProperty({ description: '주차', example: 6 })
  @IsInt()
  @Min(1)
  @Max(53)
  weekNumber: number;
}

export class ListModelsDto {
  @ApiProperty({ description: 'AI 프로바이더', example: 'anthropic' })
  @IsString()
  provider: string;

  @ApiPropertyOptional({ description: 'API 키 (ollama 제외)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Ollama 서버 URL', example: 'http://localhost:11434' })
  @IsOptional()
  @IsString()
  ollamaBaseUrl?: string;
}

export class ExtractWeeklyTasksDto {
  @ApiProperty({ description: '주간 보고서 텍스트' })
  @IsString()
  reportText: string;

  @ApiProperty({ description: '연도', example: 2026 })
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiProperty({ description: '주차', example: 6 })
  @IsInt()
  @Min(1)
  @Max(53)
  weekNumber: number;
}

export class ChatDto {
  @ApiProperty({ description: '사용자 메시지', example: '이번 주 내 업무 현황을 알려줘' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: '컨텍스트 타입', example: 'my-tasks' })
  @IsOptional()
  @IsString()
  contextType?: string;
}
