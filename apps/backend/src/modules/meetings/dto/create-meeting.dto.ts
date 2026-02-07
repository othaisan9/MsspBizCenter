import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsDateString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MeetingType } from '@msspbiz/shared';

class AgendaItemDto {
  @ApiProperty({ description: '안건 제목' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: '안건 설명' })
  @IsOptional()
  @IsString()
  description?: string;
}

class DecisionItemDto {
  @ApiProperty({ description: '결정 사항 제목' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: '결정 사항 설명' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateMeetingDto {
  @ApiProperty({ description: '회의 제목', example: '주간 팀 회의' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: '회의 일시 (ISO 8601)',
    example: '2026-02-07T14:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  meetingDate: string;

  @ApiPropertyOptional({ description: '회의 장소', example: '본사 회의실 A' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    description: '회의 유형',
    enum: MeetingType,
    example: MeetingType.REGULAR,
  })
  @IsOptional()
  @IsEnum(MeetingType)
  meetingType?: MeetingType;

  @ApiPropertyOptional({
    description: '회의 안건',
    type: [AgendaItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgendaItemDto)
  agenda?: AgendaItemDto[];

  @ApiPropertyOptional({
    description: '회의 내용 (Markdown)',
    example: '## 논의 사항\n- 항목 1\n- 항목 2',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: '결정 사항',
    type: [DecisionItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DecisionItemDto)
  decisions?: DecisionItemDto[];

  @ApiPropertyOptional({
    description: '참석자 ID 목록',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attendeeIds?: string[];
}
