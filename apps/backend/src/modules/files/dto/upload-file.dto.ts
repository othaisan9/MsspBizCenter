import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({
    description: '연결할 엔티티 타입 (task, meeting, contract)',
    required: false,
    example: 'task',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({
    description: '연결할 엔티티 ID',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;
}
