import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, Min, MaxLength } from 'class-validator';
import { ProductType } from '@msspbiz/shared';

export class CreateProductDto {
  @ApiProperty({ example: 'stealthmole', description: '제품 코드 (고유)' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'StealthMole', description: '제품명' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'DarkWeb 위협 인텔리전스', description: '제품 설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ProductType, example: ProductType.PLATFORM, description: '제품 유형' })
  @IsEnum(ProductType)
  productType: ProductType;

  @ApiPropertyOptional({ example: 'StealthMole Inc.', description: '제조사/공급사' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  vendor?: string;

  @ApiPropertyOptional({ example: 0, description: '표시 순서 (오름차순)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
