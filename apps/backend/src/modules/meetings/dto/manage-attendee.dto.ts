import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { AttendanceType } from '@msspbiz/shared';

export class ManageAttendeeDto {
  @ApiProperty({ description: '사용자 ID', example: 'uuid-123' })
  @IsNotEmpty()
  @IsUUID('4')
  userId: string;

  @ApiPropertyOptional({
    description: '참석 유형',
    enum: AttendanceType,
    example: AttendanceType.ATTENDED,
  })
  @IsOptional()
  @IsEnum(AttendanceType)
  attendanceType?: AttendanceType;
}
