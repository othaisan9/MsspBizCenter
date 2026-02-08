import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductOption } from './entities/product-option.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductOptionDto } from './dto/create-product-option.dto';
import { UpdateProductOptionDto } from './dto/update-product-option.dto';
import { ProductStatus } from '@msspbiz/shared';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductOption)
    private optionRepository: Repository<ProductOption>,
  ) {}

  /**
   * 제품 목록 조회 (옵션 포함, displayOrder 순으로 정렬)
   */
  async findAll(tenantId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { tenantId },
      relations: ['options'],
      order: {
        displayOrder: 'ASC',
        name: 'ASC',
        options: {
          displayOrder: 'ASC',
          name: 'ASC',
        },
      },
    });
  }

  /**
   * 제품 상세 조회 (옵션 포함)
   */
  async findOne(id: string, tenantId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, tenantId },
      relations: ['options'],
      order: {
        options: {
          displayOrder: 'ASC',
          name: 'ASC',
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  /**
   * 제품 생성
   */
  async create(dto: CreateProductDto, tenantId: string): Promise<Product> {
    // 코드 중복 체크
    const existing = await this.productRepository.findOne({
      where: { code: dto.code, tenantId },
    });

    if (existing) {
      throw new ConflictException(`Product with code '${dto.code}' already exists`);
    }

    const product = this.productRepository.create({
      ...dto,
      tenantId,
      status: ProductStatus.ACTIVE,
    });

    return this.productRepository.save(product);
  }

  /**
   * 제품 수정
   */
  async update(
    id: string,
    dto: UpdateProductDto,
    tenantId: string,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // 코드 변경 시 중복 체크
    if (dto.code && dto.code !== product.code) {
      const existing = await this.productRepository.findOne({
        where: { code: dto.code, tenantId },
      });

      if (existing) {
        throw new ConflictException(`Product with code '${dto.code}' already exists`);
      }
    }

    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  /**
   * 제품 삭제 (상태를 INACTIVE로 변경 또는 하드 삭제)
   */
  async remove(id: string, tenantId: string, hardDelete = false): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (hardDelete) {
      await this.productRepository.remove(product);
    } else {
      // Soft delete: 상태를 INACTIVE로 변경
      product.status = ProductStatus.INACTIVE;
      await this.productRepository.save(product);
    }
  }

  /**
   * 제품에 옵션 추가
   */
  async addOption(
    productId: string,
    dto: CreateProductOptionDto,
    tenantId: string,
  ): Promise<ProductOption> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // 동일 제품에 코드 중복 체크
    const existing = await this.optionRepository.findOne({
      where: { productId, code: dto.code, tenantId },
    });

    if (existing) {
      throw new ConflictException(
        `Option with code '${dto.code}' already exists for this product`,
      );
    }

    const option = this.optionRepository.create({
      ...dto,
      productId,
      tenantId,
      isActive: dto.isActive ?? true,
    });

    return this.optionRepository.save(option);
  }

  /**
   * 옵션 수정
   */
  async updateOption(
    productId: string,
    optionId: string,
    dto: UpdateProductOptionDto,
    tenantId: string,
  ): Promise<ProductOption> {
    const option = await this.optionRepository.findOne({
      where: { id: optionId, productId, tenantId },
    });

    if (!option) {
      throw new NotFoundException(`Option with ID ${optionId} not found`);
    }

    // 코드 변경 시 중복 체크
    if (dto.code && dto.code !== option.code) {
      const existing = await this.optionRepository.findOne({
        where: { productId, code: dto.code, tenantId },
      });

      if (existing) {
        throw new ConflictException(
          `Option with code '${dto.code}' already exists for this product`,
        );
      }
    }

    Object.assign(option, dto);
    return this.optionRepository.save(option);
  }

  /**
   * 옵션 삭제
   */
  async removeOption(
    productId: string,
    optionId: string,
    tenantId: string,
  ): Promise<void> {
    const option = await this.optionRepository.findOne({
      where: { id: optionId, productId, tenantId },
    });

    if (!option) {
      throw new NotFoundException(`Option with ID ${optionId} not found`);
    }

    await this.optionRepository.remove(option);
  }
}
