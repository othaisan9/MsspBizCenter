import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'document.pdf' })
  originalName: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string;

  @ApiProperty({ example: 1024000 })
  size: number;

  @ApiProperty({ example: 'task', nullable: true })
  entityType: string | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', nullable: true })
  entityId: string | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  uploadedById: string;

  @ApiProperty({ example: '2026-02-07T10:00:00Z' })
  createdAt: Date;
}
