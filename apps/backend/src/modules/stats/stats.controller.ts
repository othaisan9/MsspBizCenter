import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  DashboardStatsDto,
  WeeklyTaskStatsDto,
  MonthlyContractStatsDto,
  TasksByStatusDto,
  TasksByPriorityDto,
} from './dto/stats-response.dto';

@ApiTags('stats')
@Controller('stats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '대시보드 전체 통계 조회' })
  @ApiResponse({
    status: 200,
    description: '대시보드 통계 조회 성공',
    type: DashboardStatsDto,
  })
  async getDashboardStats(
    @CurrentUser('tenantId') tenantId: string,
  ): Promise<DashboardStatsDto> {
    return this.statsService.getDashboardStats(tenantId);
  }

  @Get('tasks/weekly')
  @ApiOperation({
    summary: '주차별 업무 통계 조회',
    description: '최근 12주간의 업무 통계를 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '주차별 업무 통계 조회 성공',
    type: [WeeklyTaskStatsDto],
  })
  async getWeeklyTaskStats(
    @CurrentUser('tenantId') tenantId: string,
  ): Promise<WeeklyTaskStatsDto[]> {
    return this.statsService.getWeeklyTaskStats(tenantId);
  }

  @Get('contracts/monthly')
  @ApiOperation({
    summary: '월별 계약 통계 조회',
    description: '최근 12개월간의 계약 통계를 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '월별 계약 통계 조회 성공',
    type: [MonthlyContractStatsDto],
  })
  async getMonthlyContractStats(
    @CurrentUser('tenantId') tenantId: string,
  ): Promise<MonthlyContractStatsDto[]> {
    return this.statsService.getMonthlyContractStats(tenantId);
  }

  @Get('tasks/by-status')
  @ApiOperation({
    summary: '상태별 업무 비율 조회',
    description: '모든 업무를 상태별로 집계하고 비율을 계산합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '상태별 업무 통계 조회 성공',
    type: [TasksByStatusDto],
  })
  async getTasksByStatus(
    @CurrentUser('tenantId') tenantId: string,
  ): Promise<TasksByStatusDto[]> {
    return this.statsService.getTasksByStatus(tenantId);
  }

  @Get('tasks/by-priority')
  @ApiOperation({
    summary: '우선순위별 업무 비율 조회',
    description: '모든 업무를 우선순위별로 집계하고 비율을 계산합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '우선순위별 업무 통계 조회 성공',
    type: [TasksByPriorityDto],
  })
  async getTasksByPriority(
    @CurrentUser('tenantId') tenantId: string,
  ): Promise<TasksByPriorityDto[]> {
    return this.statsService.getTasksByPriority(tenantId);
  }
}
