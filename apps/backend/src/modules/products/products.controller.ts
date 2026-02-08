import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductOptionDto } from './dto/create-product-option.dto';
import { UpdateProductOptionDto } from './dto/update-product-option.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@msspbiz/shared';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: '제품 목록 조회 (모든 사용자)' })
  @ApiResponse({ status: 200, description: '제품 목록 조회 성공' })
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.productsService.findAll(tenantId);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: '제품 생성 (ADMIN 이상)' })
  @ApiResponse({ status: 201, description: '제품 생성 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 409, description: '제품 코드 중복' })
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.productsService.create(createProductDto, tenantId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: '제품 상세 조회 (모든 사용자)' })
  @ApiParam({ name: 'id', description: '제품 ID' })
  @ApiResponse({ status: 200, description: '제품 조회 성공' })
  @ApiResponse({ status: 404, description: '제품을 찾을 수 없음' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.productsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: '제품 수정 (ADMIN 이상)' })
  @ApiParam({ name: 'id', description: '제품 ID' })
  @ApiResponse({ status: 200, description: '제품 수정 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '제품을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '제품 코드 중복' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.productsService.update(id, updateProductDto, tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: '제품 삭제 (OWNER만 가능, 상태를 INACTIVE로 변경)' })
  @ApiParam({ name: 'id', description: '제품 ID' })
  @ApiResponse({ status: 200, description: '제품 삭제 성공' })
  @ApiResponse({ status: 403, description: '권한 없음 (OWNER만 가능)' })
  @ApiResponse({ status: 404, description: '제품을 찾을 수 없음' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    await this.productsService.remove(id, tenantId, false);
    return { message: 'Product status changed to INACTIVE successfully' };
  }

  @Post(':id/options')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: '제품에 옵션 추가 (ADMIN 이상)' })
  @ApiParam({ name: 'id', description: '제품 ID' })
  @ApiResponse({ status: 201, description: '옵션 추가 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '제품을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '옵션 코드 중복' })
  addOption(
    @Param('id', ParseUUIDPipe) productId: string,
    @Body() createProductOptionDto: CreateProductOptionDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.productsService.addOption(
      productId,
      createProductOptionDto,
      tenantId,
    );
  }

  @Patch(':id/options/:optionId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: '제품 옵션 수정 (ADMIN 이상)' })
  @ApiParam({ name: 'id', description: '제품 ID' })
  @ApiParam({ name: 'optionId', description: '옵션 ID' })
  @ApiResponse({ status: 200, description: '옵션 수정 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '옵션을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '옵션 코드 중복' })
  updateOption(
    @Param('id', ParseUUIDPipe) productId: string,
    @Param('optionId', ParseUUIDPipe) optionId: string,
    @Body() updateProductOptionDto: UpdateProductOptionDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.productsService.updateOption(
      productId,
      optionId,
      updateProductOptionDto,
      tenantId,
    );
  }

  @Delete(':id/options/:optionId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: '제품 옵션 삭제 (ADMIN 이상)' })
  @ApiParam({ name: 'id', description: '제품 ID' })
  @ApiParam({ name: 'optionId', description: '옵션 ID' })
  @ApiResponse({ status: 200, description: '옵션 삭제 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '옵션을 찾을 수 없음' })
  async removeOption(
    @Param('id', ParseUUIDPipe) productId: string,
    @Param('optionId', ParseUUIDPipe) optionId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    await this.productsService.removeOption(productId, optionId, tenantId);
    return { message: 'Product option deleted successfully' };
  }
}
