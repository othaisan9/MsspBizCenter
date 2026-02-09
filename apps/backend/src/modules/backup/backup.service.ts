import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';
import { MeetingNote } from '../meetings/entities/meeting-note.entity';
import { MeetingAttendee } from '../meetings/entities/meeting-attendee.entity';
import { ActionItem } from '../meetings/entities/action-item.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { ContractProduct } from '../products/entities/contract-product.entity';
import { ContractHistory } from '../contracts/entities/contract-history.entity';
import { Product } from '../products/entities/product.entity';
import { ProductOption } from '../products/entities/product-option.entity';
import { User } from '../auth/entities/user.entity';
import { EncryptionService } from '../contracts/services/encryption.service';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(MeetingNote)
    private meetingRepo: Repository<MeetingNote>,
    @InjectRepository(MeetingAttendee)
    private attendeeRepo: Repository<MeetingAttendee>,
    @InjectRepository(ActionItem)
    private actionItemRepo: Repository<ActionItem>,
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
    @InjectRepository(ContractProduct)
    private contractProductRepo: Repository<ContractProduct>,
    @InjectRepository(ContractHistory)
    private contractHistoryRepo: Repository<ContractHistory>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductOption)
    private productOptionRepo: Repository<ProductOption>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private encryptionService: EncryptionService,
    private dataSource: DataSource,
  ) {}

  /**
   * JSON 내보내기
   */
  async exportJson(tenantId: string, modules: string[]) {
    const allModules = ['tasks', 'meetings', 'contracts', 'products', 'users'];
    const selectedModules = modules.length > 0 ? modules : allModules;

    this.logger.log(
      `Exporting JSON for tenant ${tenantId}, modules: ${selectedModules.join(', ')}`,
    );

    const data: any = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tenantId,
      modules: {},
    };

    if (selectedModules.includes('tasks')) {
      data.modules.tasks = await this.taskRepo.find({
        where: { tenantId },
        relations: ['assignee', 'creator'],
        order: { createdAt: 'DESC' },
      });
      this.logger.log(`Exported ${data.modules.tasks.length} tasks`);
    }

    if (selectedModules.includes('meetings')) {
      data.modules.meetings = await this.meetingRepo.find({
        where: { tenantId },
        relations: ['creator', 'attendees', 'attendees.user', 'actionItems'],
        order: { meetingDate: 'DESC' },
      });
      this.logger.log(`Exported ${data.modules.meetings.length} meetings`);
    }

    if (selectedModules.includes('contracts')) {
      const contracts = await this.contractRepo.find({
        where: { tenantId },
        relations: [
          'creator',
          'internalManager',
          'contractProducts',
          'contractProducts.product',
          'contractProducts.productOption',
        ],
        order: { createdAt: 'DESC' },
      });

      // 암호화된 금액 복호화
      data.modules.contracts = contracts.map((c) => {
        const result: any = { ...c };

        // 금액 복호화
        if (c.amountEncrypted) {
          try {
            result.amount = parseFloat(
              this.encryptionService.decrypt(c.amountEncrypted),
            );
          } catch (error) {
            this.logger.warn(
              `Failed to decrypt amount for contract ${c.id}`,
              error,
            );
          }
        }

        // 매입 단가 복호화
        if (c.purchasePriceEncrypted) {
          try {
            result.purchasePrice = parseFloat(
              this.encryptionService.decrypt(c.purchasePriceEncrypted),
            );
          } catch (error) {
            this.logger.warn(
              `Failed to decrypt purchasePrice for contract ${c.id}`,
              error,
            );
          }
        }

        // 판매 단가 복호화
        if (c.sellingPriceEncrypted) {
          try {
            result.sellingPrice = parseFloat(
              this.encryptionService.decrypt(c.sellingPriceEncrypted),
            );
          } catch (error) {
            this.logger.warn(
              `Failed to decrypt sellingPrice for contract ${c.id}`,
              error,
            );
          }
        }

        // 암호화 필드 제거 (내보내기에 불필요)
        delete result.amountEncrypted;
        delete result.purchasePriceEncrypted;
        delete result.sellingPriceEncrypted;

        return result;
      });

      this.logger.log(`Exported ${data.modules.contracts.length} contracts`);
    }

    if (selectedModules.includes('products')) {
      data.modules.products = await this.productRepo.find({
        where: { tenantId },
        relations: ['options'],
        order: { displayOrder: 'ASC' },
      });
      this.logger.log(`Exported ${data.modules.products.length} products`);
    }

    if (selectedModules.includes('users')) {
      const users = await this.userRepo.find({ where: { tenantId } });
      // 비밀번호 해시 제거
      data.modules.users = users.map(({ passwordHash, ...u }) => u);
      this.logger.log(`Exported ${data.modules.users.length} users`);
    }

    return data;
  }

  /**
   * CSV 내보내기
   */
  async exportCsv(tenantId: string, modules: string[]): Promise<string> {
    const data = await this.exportJson(tenantId, modules);
    const sections: string[] = [];

    if (data.modules.tasks) {
      sections.push('# Tasks');
      sections.push(
        '제목,상태,우선순위,담당자,마감일,주차,년도,생성일',
      );
      for (const t of data.modules.tasks) {
        sections.push(
          [
            this.csvEscape(t.title),
            t.status,
            t.priority,
            t.assignee?.name || '',
            t.dueDate || '',
            t.weekNumber || '',
            t.year || '',
            t.createdAt,
          ].join(','),
        );
      }
      sections.push('');
    }

    if (data.modules.meetings) {
      sections.push('# Meetings');
      sections.push('제목,회의일,유형,상태,작성자,생성일');
      for (const m of data.modules.meetings) {
        sections.push(
          [
            this.csvEscape(m.title),
            m.meetingDate,
            m.meetingType,
            m.status,
            m.creator?.name || '',
            m.createdAt,
          ].join(','),
        );
      }
      sections.push('');
    }

    if (data.modules.contracts) {
      sections.push('# Contracts');
      sections.push(
        '제목,계약번호,공급사,고객사,시작일,종료일,금액,상태,유형',
      );
      for (const c of data.modules.contracts) {
        sections.push(
          [
            this.csvEscape(c.title),
            c.contractNumber || '',
            this.csvEscape(c.partyA),
            this.csvEscape(c.partyB),
            c.startDate,
            c.endDate || '',
            c.amount || '',
            c.status,
            c.contractType,
          ].join(','),
        );
      }
      sections.push('');
    }

    if (data.modules.products) {
      sections.push('# Products');
      sections.push('코드,이름,설명,상태,벤더');
      for (const p of data.modules.products) {
        sections.push(
          [
            p.code,
            this.csvEscape(p.name),
            this.csvEscape(p.description || ''),
            p.status,
            this.csvEscape(p.vendor || ''),
          ].join(','),
        );
      }
      sections.push('');
    }

    if (data.modules.users) {
      sections.push('# Users');
      sections.push('이름,이메일,역할,소속,소속명,상태');
      for (const u of data.modules.users) {
        sections.push(
          [
            this.csvEscape(u.name),
            u.email,
            u.role,
            u.affiliation || 'internal',
            this.csvEscape(u.affiliationName || ''),
            u.isActive ? '활성' : '비활성',
          ].join(','),
        );
      }
    }

    return sections.join('\n');
  }

  /**
   * CSV 이스케이프 헬퍼 (쉼표나 따옴표가 포함된 문자열 처리)
   */
  private csvEscape(value: string | null | undefined): string {
    if (!value) return '';
    const str = String(value);
    // 쉼표, 따옴표, 줄바꿈이 포함되어 있으면 따옴표로 감싸기
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      // 따옴표는 두 번 반복 (RFC 4180 표준)
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Import 미리보기
   */
  async importPreview(data: any) {
    const result: Record<string, number> = {};

    if (data.modules?.tasks) {
      result.tasks = data.modules.tasks.length;
    }
    if (data.modules?.meetings) {
      result.meetings = data.modules.meetings.length;
    }
    if (data.modules?.contracts) {
      result.contracts = data.modules.contracts.length;
    }
    if (data.modules?.products) {
      result.products = data.modules.products.length;
    }
    if (data.modules?.users) {
      result.users = data.modules.users.length;
    }

    return {
      version: data.version,
      exportedAt: data.exportedAt,
      counts: result,
    };
  }

  /**
   * Import 실행 (트랜잭션)
   */
  async importData(tenantId: string, data: any) {
    this.logger.log(`Starting import for tenant ${tenantId}`);

    return this.dataSource.transaction(async (manager) => {
      const result: Record<string, { created: number }> = {};

      // Products (다른 모듈에서 참조하므로 먼저)
      if (data.modules?.products) {
        let created = 0;
        for (const p of data.modules.products) {
          const product = manager.create(Product, {
            code: p.code,
            name: p.name,
            description: p.description,
            status: p.status,
            vendor: p.vendor,
            displayOrder: p.displayOrder,
            tenantId,
          });
          const saved = await manager.save(Product, product);

          // 옵션 저장
          if (p.options?.length) {
            for (const opt of p.options) {
              await manager.save(ProductOption, {
                productId: saved.id,
                name: opt.name,
                description: opt.description,
                tenantId,
              });
            }
          }
          created++;
        }
        result.products = { created };
        this.logger.log(`Imported ${created} products`);
      }

      // Users (보안상 스킵 - 비밀번호 해시 없이 사용자 생성은 위험)
      if (data.modules?.users) {
        result.users = { created: 0 };
        this.logger.warn(
          'User import skipped for security reasons (no password hash)',
        );
      }

      // Tasks
      if (data.modules?.tasks) {
        let created = 0;
        for (const t of data.modules.tasks) {
          await manager.save(Task, {
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            weekNumber: t.weekNumber,
            year: t.year,
            dueDate: t.dueDate,
            estimatedHours: t.estimatedHours,
            actualHours: t.actualHours,
            tags: t.tags,
            createdBy: t.createdBy,
            assigneeId: t.assigneeId,
            tenantId,
          });
          created++;
        }
        result.tasks = { created };
        this.logger.log(`Imported ${created} tasks`);
      }

      // Meetings
      if (data.modules?.meetings) {
        let created = 0;
        for (const m of data.modules.meetings) {
          const meeting = await manager.save(MeetingNote, {
            title: m.title,
            meetingDate: m.meetingDate,
            location: m.location,
            meetingType: m.meetingType,
            agenda: m.agenda,
            content: m.content,
            decisions: m.decisions,
            status: m.status,
            createdBy: m.createdBy,
            tenantId,
          });

          // 참석자 저장 (userId 존재 확인 필요)
          if (m.attendees?.length) {
            for (const att of m.attendees) {
              if (att.userId) {
                const userExists = await manager.findOne(User, {
                  where: { id: att.userId, tenantId },
                });
                if (userExists) {
                  await manager.save(MeetingAttendee, {
                    meetingId: meeting.id,
                    userId: att.userId,
                    tenantId,
                  });
                }
              }
            }
          }

          // 액션 아이템 저장
          if (m.actionItems?.length) {
            for (const ai of m.actionItems) {
              await manager.save(ActionItem, {
                meetingId: meeting.id,
                content: ai.content,
                assigneeId: ai.assigneeId,
                dueDate: ai.dueDate,
                completed: ai.completed,
                tenantId,
              });
            }
          }

          created++;
        }
        result.meetings = { created };
        this.logger.log(`Imported ${created} meetings`);
      }

      // Contracts
      if (data.modules?.contracts) {
        let created = 0;
        for (const c of data.modules.contracts) {
          // 금액 재암호화
          let amountEncrypted = null;
          let purchasePriceEncrypted = null;
          let sellingPriceEncrypted = null;

          if (c.amount != null) {
            amountEncrypted = this.encryptionService.encrypt(String(c.amount));
          }
          if (c.purchasePrice != null) {
            purchasePriceEncrypted = this.encryptionService.encrypt(
              String(c.purchasePrice),
            );
          }
          if (c.sellingPrice != null) {
            sellingPriceEncrypted = this.encryptionService.encrypt(
              String(c.sellingPrice),
            );
          }

          const contract = await manager.save(Contract, {
            title: c.title,
            contractNumber: c.contractNumber,
            contractType: c.contractType,
            sourceType: c.sourceType,
            originalVendor: c.originalVendor,
            partyA: c.partyA,
            partyB: c.partyB,
            partyBContact: c.partyBContact,
            startDate: c.startDate,
            endDate: c.endDate,
            amountEncrypted,
            currency: c.currency,
            paymentTerms: c.paymentTerms,
            paymentCycle: c.paymentCycle,
            vatIncluded: c.vatIncluded ?? true,
            purchasePriceEncrypted,
            purchaseCommissionRate: c.purchaseCommissionRate,
            sellingPriceEncrypted,
            hasPartner: c.hasPartner ?? false,
            partnerName: c.partnerName,
            commissionType: c.commissionType,
            partnerCommission: c.partnerCommission,
            internalManagerId: c.internalManagerId,
            memo: c.memo,
            notifyBefore30Days: c.notifyBefore30Days ?? true,
            notifyBefore7Days: c.notifyBefore7Days ?? true,
            notifyOnExpiry: c.notifyOnExpiry ?? false,
            status: c.status,
            autoRenewal: c.autoRenewal,
            renewalNoticeDays: c.renewalNoticeDays,
            description: c.description,
            createdBy: c.createdBy,
            tenantId,
          });

          // 계약 제품 저장
          if (c.contractProducts?.length) {
            for (const cp of c.contractProducts) {
              if (cp.productId) {
                const productExists = await manager.findOne(Product, {
                  where: { id: cp.productId, tenantId },
                });
                if (productExists) {
                  await manager.save(ContractProduct, {
                    contractId: contract.id,
                    productId: cp.productId,
                    productOptionId: cp.productOptionId || null,
                    quantity: cp.quantity || 1,
                    notes: cp.notes,
                    tenantId,
                  });
                }
              }
            }
          }

          created++;
        }
        result.contracts = { created };
        this.logger.log(`Imported ${created} contracts`);
      }

      return result;
    });
  }
}
