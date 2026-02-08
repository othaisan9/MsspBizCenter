import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: '전체 업무 수' })
  totalTasks: number;

  @ApiProperty({ description: '이번주 완료 업무 수' })
  completedThisWeek: number;

  @ApiProperty({ description: '전체 회의 수' })
  totalMeetings: number;

  @ApiProperty({ description: '전체 계약 수' })
  totalContracts: number;

  @ApiProperty({ description: '만료 임박 계약 수 (30일 이내)' })
  expiringContracts: number;

  @ApiProperty({ description: '진행 중 업무 수' })
  inProgressTasks: number;

  @ApiProperty({ description: '활성 계약 수' })
  activeContracts: number;
}

export class WeeklyTaskStatsDto {
  @ApiProperty({ description: '주차 (1-53)' })
  week: number;

  @ApiProperty({ description: '연도' })
  year: number;

  @ApiProperty({ description: '전체 업무 수' })
  total: number;

  @ApiProperty({ description: '완료된 업무 수' })
  completed: number;

  @ApiProperty({ description: '진행 중 업무 수' })
  inProgress: number;
}

export class MonthlyContractStatsDto {
  @ApiProperty({ description: '월 (1-12)' })
  month: number;

  @ApiProperty({ description: '연도' })
  year: number;

  @ApiProperty({ description: '신규 계약 수' })
  newContracts: number;

  @ApiProperty({ description: '갱신 계약 수' })
  renewals: number;

  @ApiProperty({ description: '총 계약 금액 (암호화되지 않은 합계)' })
  totalAmount: number;
}

export class TasksByStatusDto {
  @ApiProperty({ description: '업무 상태' })
  status: string;

  @ApiProperty({ description: '해당 상태의 업무 수' })
  count: number;

  @ApiProperty({ description: '전체 대비 비율 (%)' })
  percentage: number;
}

export class TasksByPriorityDto {
  @ApiProperty({ description: '우선순위' })
  priority: string;

  @ApiProperty({ description: '해당 우선순위의 업무 수' })
  count: number;

  @ApiProperty({ description: '전체 대비 비율 (%)' })
  percentage: number;
}
