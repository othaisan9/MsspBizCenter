import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { MeetingType, MeetingNoteStatus } from '@msspbiz/shared';

export class QueryMeetingDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '회의 유형 필터',
    enum: MeetingType,
  })
  @IsOptional()
  @IsEnum(MeetingType)
  meetingType?: MeetingType;

  @ApiPropertyOptional({
    description: '회의록 상태 필터',
    enum: MeetingNoteStatus,
  })
  @IsOptional()
  @IsEnum(MeetingNoteStatus)
  status?: MeetingNoteStatus;

  @ApiPropertyOptional({
    description: '시작 날짜 (ISO 8601)',
    example: '2026-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '종료 날짜 (ISO 8601)',
    example: '2026-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: '검색어 (제목, 내용)',
    example: '주간 회의',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
