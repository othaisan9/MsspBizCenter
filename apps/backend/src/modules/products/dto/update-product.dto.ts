import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ProductStatus } from '@msspbiz/shared';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({ enum: ProductStatus, example: ProductStatus.ACTIVE, description: '제품 상태' })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
