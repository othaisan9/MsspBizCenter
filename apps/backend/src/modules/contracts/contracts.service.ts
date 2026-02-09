import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, Like } from 'typeorm';
import { Contract } from './entities/contract.entity';
import { ContractHistory, ContractHistoryAction } from './entities/contract-history.entity';
import { ContractProduct } from '../products/entities/contract-product.entity';
import { EncryptionService } from './services/encryption.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { QueryContractDto } from './dto/query-contract.dto';
import { ContractStatus } from '@msspbiz/shared';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(ContractHistory)
    private historyRepository: Repository<ContractHistory>,
    @InjectRepository(ContractProduct)
    private contractProductRepository: Repository<ContractProduct>,
    private encryptionService: EncryptionService,
  ) {}

  /**
   * 계약 생성
   */
  async create(
    dto: CreateContractDto,
    tenantId: string,
    userId: string,
  ): Promise<Contract> {
    // 금액 암호화
    let amountEncrypted: string | null = null;
    if (dto.amount !== undefined && dto.amount !== null) {
      amountEncrypted = this.encryptionService.encrypt(dto.amount.toString());
    }

    // 매입 단가 암호화
    let purchasePriceEncrypted: string | null = null;
    if (dto.purchasePrice !== undefined && dto.purchasePrice !== null) {
      purchasePriceEncrypted = this.encryptionService.encrypt(dto.purchasePrice.toString());
    }

    // 판매 단가 암호화
    let sellingPriceEncrypted: string | null = null;
    if (dto.sellingPrice !== undefined && dto.sellingPrice !== null) {
      sellingPriceEncrypted = this.encryptionService.encrypt(dto.sellingPrice.toString());
    }

    // products는 별도 처리 → DTO spread에서 제외
    const { products, ...contractFields } = dto;

    const contract = this.contractRepository.create({
      ...contractFields,
      tenantId,
      createdBy: userId,
      amountEncrypted,
      purchasePriceEncrypted,
      sellingPriceEncrypted,
      status: dto.status || ContractStatus.DRAFT,
    });

    const savedContract = await this.contractRepository.save(contract);

    // 계약 제품 저장
    if (products && products.length > 0) {
      const contractProducts = products.map((p) =>
        this.contractProductRepository.create({
          contractId: savedContract.id,
          productId: p.productId,
          productOptionId: p.productOptionId || null,
          quantity: p.quantity || 1,
          notes: p.notes || null,
          tenantId,
        }),
      );
      await this.contractProductRepository.save(contractProducts);
    }

    // 히스토리 기록
    await this.createHistory(
      savedContract.id,
      ContractHistoryAction.CREATED,
      null,
      this.sanitizeContractData(savedContract),
      userId,
    );

    return savedContract;
  }

  /**
   * 계약 목록 조회 (필터링 + 페이징)
   */
  async findAll(query: QueryContractDto, tenantId: string) {
    const {
      page = 1,
      limit = 20,
      contractType,
      status,
      search,
      startDateFrom,
      startDateTo,
      expiringWithinDays,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.contractRepository
      .createQueryBuilder('contract')
      .where('contract.tenantId = :tenantId', { tenantId });

    // 필터링
    if (contractType) {
      qb.andWhere('contract.contractType = :contractType', { contractType });
    }

    if (status) {
      qb.andWhere('contract.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(contract.title ILIKE :search OR contract.contractNumber ILIKE :search OR contract.partyA ILIKE :search OR contract.partyB ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (startDateFrom) {
      qb.andWhere('contract.startDate >= :startDateFrom', { startDateFrom });
    }

    if (startDateTo) {
      qb.andWhere('contract.startDate <= :startDateTo', { startDateTo });
    }

    // 만료 예정 필터
    if (expiringWithinDays) {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + expiringWithinDays);

      qb.andWhere('contract.endDate IS NOT NULL')
        .andWhere('contract.endDate BETWEEN :now AND :futureDate', {
          now: now.toISOString().split('T')[0],
          futureDate: futureDate.toISOString().split('T')[0],
        });
    }

    // 정렬 (SQL Injection 방지: 화이트리스트 검증)
    const allowedSortFields = ['createdAt', 'updatedAt', 'startDate', 'endDate', 'title', 'contractNumber', 'status'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    qb.orderBy(`contract.${safeSortBy}`, sortOrder as 'ASC' | 'DESC');

    // 페이징
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 계약 상세 조회 (금액 복호화 포함)
   */
  async findOne(id: string, tenantId: string): Promise<Contract & { amount?: number; purchasePrice?: number; sellingPrice?: number }> {
    const contract = await this.contractRepository.findOne({
      where: { id, tenantId },
      relations: ['creator', 'parentContract', 'renewals', 'internalManager', 'contractProducts', 'contractProducts.product', 'contractProducts.productOption'],
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    // 금액 복호화
    const result: Contract & { amount?: number; purchasePrice?: number; sellingPrice?: number } = { ...contract };
    if (contract.amountEncrypted) {
      try {
        const decrypted = this.encryptionService.decrypt(contract.amountEncrypted);
        result.amount = parseFloat(decrypted);
      } catch (error) {
        // 복호화 실패 시 로그만 남기고 계속 진행
        console.error('Failed to decrypt contract amount:', error);
      }
    }

    // 매입 단가 복호화
    if (contract.purchasePriceEncrypted) {
      try {
        const decrypted = this.encryptionService.decrypt(contract.purchasePriceEncrypted);
        result.purchasePrice = parseFloat(decrypted);
      } catch (error) {
        console.error('Failed to decrypt purchase price:', error);
      }
    }

    // 판매 단가 복호화
    if (contract.sellingPriceEncrypted) {
      try {
        const decrypted = this.encryptionService.decrypt(contract.sellingPriceEncrypted);
        result.sellingPrice = parseFloat(decrypted);
      } catch (error) {
        console.error('Failed to decrypt selling price:', error);
      }
    }

    return result;
  }

  /**
   * 계약 수정
   */
  async update(
    id: string,
    dto: UpdateContractDto,
    tenantId: string,
    userId: string,
  ): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id, tenantId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    // 이전 데이터 스냅샷
    const previousData = this.sanitizeContractData(contract);

    // 금액 변경 시 암호화
    if (dto.amount !== undefined) {
      contract.amountEncrypted = dto.amount !== null
        ? this.encryptionService.encrypt(dto.amount.toString())
        : null;
    }

    // 매입 단가 변경 시 암호화
    if (dto.purchasePrice !== undefined) {
      contract.purchasePriceEncrypted = dto.purchasePrice !== null
        ? this.encryptionService.encrypt(dto.purchasePrice.toString())
        : null;
    }

    // 판매 단가 변경 시 암호화
    if (dto.sellingPrice !== undefined) {
      contract.sellingPriceEncrypted = dto.sellingPrice !== null
        ? this.encryptionService.encrypt(dto.sellingPrice.toString())
        : null;
    }

    // products는 별도 처리 → DTO spread에서 제외
    const { products, amount, purchasePrice, sellingPrice, ...restDto } = dto;

    // 나머지 필드 업데이트
    Object.assign(contract, {
      ...restDto,
      amountEncrypted: contract.amountEncrypted,
      purchasePriceEncrypted: contract.purchasePriceEncrypted,
      sellingPriceEncrypted: contract.sellingPriceEncrypted,
    });

    const updatedContract = await this.contractRepository.save(contract);

    // 계약 제품 업데이트 (기존 삭제 후 재생성)
    if (products !== undefined) {
      await this.contractProductRepository.delete({ contractId: id });
      if (products && products.length > 0) {
        const contractProducts = products.map((p) =>
          this.contractProductRepository.create({
            contractId: id,
            productId: p.productId,
            productOptionId: p.productOptionId || null,
            quantity: p.quantity || 1,
            notes: p.notes || null,
            tenantId,
          }),
        );
        await this.contractProductRepository.save(contractProducts);
      }
    }

    // 히스토리 기록
    await this.createHistory(
      id,
      ContractHistoryAction.UPDATED,
      previousData,
      this.sanitizeContractData(updatedContract),
      userId,
    );

    return updatedContract;
  }

  /**
   * 계약 삭제 (Owner only)
   */
  async remove(id: string, tenantId: string): Promise<void> {
    const contract = await this.contractRepository.findOne({
      where: { id, tenantId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    await this.contractRepository.remove(contract);
  }

  /**
   * 계약 상태 변경
   */
  async updateStatus(
    id: string,
    status: ContractStatus,
    tenantId: string,
    userId: string,
  ): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id, tenantId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    const previousData = this.sanitizeContractData(contract);

    contract.status = status;
    const updatedContract = await this.contractRepository.save(contract);

    // 히스토리 기록
    let action = ContractHistoryAction.UPDATED;
    if (status === ContractStatus.TERMINATED) {
      action = ContractHistoryAction.TERMINATED;
    }

    await this.createHistory(
      id,
      action,
      previousData,
      this.sanitizeContractData(updatedContract),
      userId,
    );

    return updatedContract;
  }

  /**
   * 계약 갱신
   */
  async renew(id: string, tenantId: string, userId: string): Promise<Contract> {
    const originalContract = await this.contractRepository.findOne({
      where: { id, tenantId },
    });

    if (!originalContract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    if (originalContract.status === ContractStatus.RENEWED) {
      throw new BadRequestException('This contract has already been renewed');
    }

    // 기존 계약 상태 변경
    originalContract.status = ContractStatus.RENEWED;
    await this.contractRepository.save(originalContract);

    // 히스토리 기록
    await this.createHistory(
      id,
      ContractHistoryAction.RENEWED,
      null,
      { status: ContractStatus.RENEWED },
      userId,
    );

    // 새 계약 생성 (기존 계약 정보 복사)
    const newContract = this.contractRepository.create({
      ...originalContract,
      id: undefined, // 새 ID 생성
      parentContractId: originalContract.id,
      status: ContractStatus.DRAFT,
      createdBy: userId,
      createdAt: undefined,
      updatedAt: undefined,
    });

    const savedNewContract = await this.contractRepository.save(newContract);

    // 새 계약 히스토리 기록
    await this.createHistory(
      savedNewContract.id,
      ContractHistoryAction.CREATED,
      null,
      this.sanitizeContractData(savedNewContract),
      userId,
    );

    return savedNewContract;
  }

  /**
   * 만료 예정 계약 목록
   */
  async getExpiring(days: number, tenantId: string): Promise<Contract[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return this.contractRepository.find({
      where: {
        tenantId,
        endDate: Between(now, futureDate),
        status: ContractStatus.ACTIVE,
      },
      order: {
        endDate: 'ASC',
      },
    });
  }

  /**
   * 계약 대시보드 (통계)
   */
  async getDashboard(tenantId: string) {
    const total = await this.contractRepository.count({ where: { tenantId } });

    const byStatus = await this.contractRepository
      .createQueryBuilder('contract')
      .select('contract.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('contract.tenantId = :tenantId', { tenantId })
      .groupBy('contract.status')
      .getRawMany();

    const byType = await this.contractRepository
      .createQueryBuilder('contract')
      .select('contract.contractType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('contract.tenantId = :tenantId', { tenantId })
      .groupBy('contract.contractType')
      .getRawMany();

    const expiring30Days = await this.getExpiring(30, tenantId);
    const expiring7Days = await this.getExpiring(7, tenantId);

    return {
      total,
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: parseInt(item.count, 10),
      })),
      byType: byType.map((item) => ({
        type: item.type,
        count: parseInt(item.count, 10),
      })),
      expiring: {
        within30Days: expiring30Days.length,
        within7Days: expiring7Days.length,
      },
    };
  }

  /**
   * 계약 변경 이력 조회
   */
  async getHistory(contractId: string, tenantId: string): Promise<ContractHistory[]> {
    // 계약 존재 확인
    const contract = await this.contractRepository.findOne({
      where: { id: contractId, tenantId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }

    return this.historyRepository.find({
      where: { contractId },
      relations: ['changer'],
      order: { changedAt: 'DESC' },
    });
  }

  /**
   * 히스토리 기록 생성 (내부 헬퍼)
   */
  private async createHistory(
    contractId: string,
    action: ContractHistoryAction,
    previousData: Record<string, any> | null,
    newData: Record<string, any> | null,
    userId: string,
  ): Promise<void> {
    const history = this.historyRepository.create({
      contractId,
      action,
      previousData,
      newData,
      changedBy: userId,
      changedAt: new Date(),
    });

    await this.historyRepository.save(history);
  }

  /**
   * 계약 데이터 정리 (히스토리용, 민감정보 제외)
   */
  private sanitizeContractData(contract: Contract): Record<string, any> {
    const { amountEncrypted, purchasePriceEncrypted, sellingPriceEncrypted, ...rest } = contract;
    return rest;
  }
}
