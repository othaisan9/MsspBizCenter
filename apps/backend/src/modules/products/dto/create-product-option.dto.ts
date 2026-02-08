import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength } from 'class-validator';

export class CreateProductOptionDto {
  @ApiProperty({ example: 'DT', description: '옵션 코드' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Dark Tracer', description: '옵션명' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'DarkWeb 추적 서비스', description: '옵션 설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true, description: '활성화 여부' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0, description: '표시 순서 (오름차순)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
