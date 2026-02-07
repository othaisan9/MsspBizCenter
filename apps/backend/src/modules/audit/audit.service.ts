import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { AuditAction, AUDIT_RETENTION_DAYS } from '@msspbiz/shared';

export interface LogOptions {
  entityType: string;
  entityId?: string;
  action: AuditAction;
  tenantId: string;
  userId?: string;
  userEmail?: string;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  details?: Record<string, any>;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TimelineItem {
  id: string;
  action: AuditAction;
  timestamp: Date;
  userId: string | null;
  userEmail: string | null;
  description: string | null;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * 감사 로그 기록
   */
  async log(options: LogOptions): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        tenantId: options.tenantId,
        entityType: options.entityType,
        entityId: options.entityId || null,
        action: options.action,
        userId: options.userId || null,
        userEmail: options.userEmail || null,
        previousValue: options.previousValue || null,
        newValue: options.newValue || null,
        details: options.details || null,
        description: options.description || null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
      });

      return await this.auditLogRepository.save(auditLog);
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 감사 로그 목록 조회 (페이지네이션 + 필터)
   */
  async findAll(query: QueryAuditLogDto, tenantId: string) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      entityType,
      entityId,
      action,
      userId,
      startDate,
      endDate,
    } = query;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.tenant_id = :tenantId', { tenantId });

    // 필터 적용
    if (entityType) {
      queryBuilder.andWhere('audit_log.entity_type = :entityType', { entityType });
    }

    if (entityId) {
      queryBuilder.andWhere('audit_log.entity_id = :entityId', { entityId });
    }

    if (action) {
      queryBuilder.andWhere('audit_log.action = :action', { action });
    }

    if (userId) {
      queryBuilder.andWhere('audit_log.user_id = :userId', { userId });
    }

    if (startDate) {
      queryBuilder.andWhere('audit_log.created_at >= :startDate', {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      queryBuilder.andWhere('audit_log.created_at <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    // 정렬
    const orderField = sortBy === 'createdAt' ? 'audit_log.created_at' : `audit_log.${sortBy}`;
    queryBuilder.orderBy(orderField, sortOrder);

    // 페이지네이션
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 특정 엔티티의 감사 로그 조회
   */
  async getByEntity(entityType: string, entityId: string, tenantId: string) {
    return await this.auditLogRepository.find({
      where: {
        tenantId,
        entityType,
        entityId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * 특정 엔티티의 타임라인 (변경 전/후 diff 추출)
   */
  async getTimeline(
    entityType: string,
    entityId: string,
    tenantId: string,
  ): Promise<TimelineItem[]> {
    const logs = await this.getByEntity(entityType, entityId, tenantId);

    return logs.map((log) => {
      const timelineItem: TimelineItem = {
        id: log.id,
        action: log.action,
        timestamp: log.createdAt,
        userId: log.userId,
        userEmail: log.userEmail,
        description: log.description,
      };

      // 변경사항 추출 (previousValue와 newValue 비교)
      if (log.previousValue && log.newValue) {
        const changes: { field: string; oldValue: any; newValue: any }[] = [];

        // newValue의 모든 키를 순회하며 변경사항 찾기
        for (const field of Object.keys(log.newValue)) {
          const oldValue = log.previousValue[field];
          const newValue = log.newValue[field];

          // 값이 다른 경우만 변경사항으로 기록
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({
              field,
              oldValue,
              newValue,
            });
          }
        }

        if (changes.length > 0) {
          timelineItem.changes = changes;
        }
      }

      return timelineItem;
    });
  }

  /**
   * 특정 사용자의 활동 로그
   */
  async getUserActivity(userId: string, tenantId: string) {
    return await this.auditLogRepository.find({
      where: {
        tenantId,
        userId,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 100, // 최근 100개만
    });
  }

  /**
   * 오래된 감사 로그 삭제 (보존 기간 초과)
   */
  async cleanupOldLogs(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - AUDIT_RETENTION_DAYS);

      const result = await this.auditLogRepository.delete({
        createdAt: LessThan(cutoffDate),
      });

      const deletedCount = result.affected || 0;

      if (deletedCount > 0) {
        this.logger.log(
          `Cleaned up ${deletedCount} audit logs older than ${AUDIT_RETENTION_DAYS} days`,
        );
      }

      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to cleanup old audit logs: ${error.message}`, error.stack);
      throw error;
    }
  }
}
