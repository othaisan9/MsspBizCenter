import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';
import { MeetingNote } from '../meetings/entities/meeting-note.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { TaskStatus, ContractStatus } from '@msspbiz/shared';
import {
  DashboardStatsDto,
  WeeklyTaskStatsDto,
  MonthlyContractStatsDto,
  TasksByStatusDto,
  TasksByPriorityDto,
} from './dto/stats-response.dto';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(MeetingNote)
    private readonly meetingRepository: Repository<MeetingNote>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async getDashboardStats(tenantId: string): Promise<DashboardStatsDto> {
    // 현재 주차 계산
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const dayOfYear =
      Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const currentWeek = Math.ceil(dayOfYear / 7);

    const [
      totalTasks,
      completedThisWeek,
      inProgressTasks,
      totalMeetings,
      totalContracts,
      activeContracts,
      expiringContracts,
    ] = await Promise.all([
      // 전체 업무 수
      this.taskRepository.count({
        where: { tenantId },
      }),
      // 이번주 완료 업무 수
      this.taskRepository.count({
        where: {
          tenantId,
          year: currentYear,
          weekNumber: currentWeek,
          status: TaskStatus.COMPLETED,
        },
      }),
      // 진행 중 업무 수
      this.taskRepository.count({
        where: {
          tenantId,
          status: TaskStatus.IN_PROGRESS,
        },
      }),
      // 전체 회의 수
      this.meetingRepository.count({
        where: { tenantId },
      }),
      // 전체 계약 수
      this.contractRepository.count({
        where: { tenantId },
      }),
      // 활성 계약 수
      this.contractRepository.count({
        where: {
          tenantId,
          status: ContractStatus.ACTIVE,
        },
      }),
      // 만료 임박 계약 수 (30일 이내)
      this.contractRepository
        .createQueryBuilder('contract')
        .where('contract.tenantId = :tenantId', { tenantId })
        .andWhere('contract.status = :status', { status: ContractStatus.ACTIVE })
        .andWhere('contract.endDate IS NOT NULL')
        .andWhere('contract.endDate <= :thirtyDaysFromNow', {
          thirtyDaysFromNow: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .andWhere('contract.endDate >= :now', { now: new Date() })
        .getCount(),
    ]);

    return {
      totalTasks,
      completedThisWeek,
      inProgressTasks,
      totalMeetings,
      totalContracts,
      activeContracts,
      expiringContracts,
    };
  }

  async getWeeklyTaskStats(tenantId: string): Promise<WeeklyTaskStatsDto[]> {
    // 최근 12주 데이터 조회
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const dayOfYear =
      Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const currentWeek = Math.ceil(dayOfYear / 7);

    const results = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.year', 'year')
      .addSelect('task.weekNumber', 'week')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        `COUNT(CASE WHEN task.status = '${TaskStatus.COMPLETED}' THEN 1 END)`,
        'completed',
      )
      .addSelect(
        `COUNT(CASE WHEN task.status = '${TaskStatus.IN_PROGRESS}' THEN 1 END)`,
        'inProgress',
      )
      .where('task.tenantId = :tenantId', { tenantId })
      .groupBy('task.year')
      .addGroupBy('task.weekNumber')
      .orderBy('task.year', 'DESC')
      .addOrderBy('task.weekNumber', 'DESC')
      .limit(12)
      .getRawMany();

    return results.map((row) => ({
      year: parseInt(row.year),
      week: parseInt(row.week),
      total: parseInt(row.total),
      completed: parseInt(row.completed),
      inProgress: parseInt(row.inProgress),
    }));
  }

  async getMonthlyContractStats(
    tenantId: string,
  ): Promise<MonthlyContractStatsDto[]> {
    // 최근 12개월 데이터 조회
    const results = await this.contractRepository
      .createQueryBuilder('contract')
      .select('EXTRACT(YEAR FROM contract.startDate)::int', 'year')
      .addSelect('EXTRACT(MONTH FROM contract.startDate)::int', 'month')
      .addSelect(
        `COUNT(CASE WHEN contract.parentContractId IS NULL THEN 1 END)`,
        'newContracts',
      )
      .addSelect(
        `COUNT(CASE WHEN contract.parentContractId IS NOT NULL THEN 1 END)`,
        'renewals',
      )
      .addSelect('0', 'totalAmount') // 암호화된 금액이므로 합계는 0으로 반환
      .where('contract.tenantId = :tenantId', { tenantId })
      .andWhere('contract.startDate >= :startDate', {
        startDate: new Date(
          new Date().setMonth(new Date().getMonth() - 12),
        ).toISOString(),
      })
      .groupBy('year')
      .addGroupBy('month')
      .orderBy('year', 'DESC')
      .addOrderBy('month', 'DESC')
      .getRawMany();

    return results.map((row) => ({
      year: row.year,
      month: row.month,
      newContracts: parseInt(row.newContracts),
      renewals: parseInt(row.renewals),
      totalAmount: row.totalAmount, // 암호화 이슈로 0
    }));
  }

  async getTasksByStatus(tenantId: string): Promise<TasksByStatusDto[]> {
    const total = await this.taskRepository.count({ where: { tenantId } });

    if (total === 0) {
      return [];
    }

    const results = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('task.tenantId = :tenantId', { tenantId })
      .groupBy('task.status')
      .getRawMany();

    return results.map((row) => ({
      status: row.status,
      count: parseInt(row.count),
      percentage: parseFloat(((parseInt(row.count) / total) * 100).toFixed(2)),
    }));
  }

  async getTasksByPriority(tenantId: string): Promise<TasksByPriorityDto[]> {
    const total = await this.taskRepository.count({ where: { tenantId } });

    if (total === 0) {
      return [];
    }

    const results = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('task.tenantId = :tenantId', { tenantId })
      .groupBy('task.priority')
      .getRawMany();

    return results.map((row) => ({
      priority: row.priority,
      count: parseInt(row.count),
      percentage: parseFloat(((parseInt(row.count) / total) * 100).toFixed(2)),
    }));
  }
}
