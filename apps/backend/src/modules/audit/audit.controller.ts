import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@msspbiz/shared';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '감사 로그 목록 조회',
    description: '페이지네이션 및 필터링을 지원하는 감사 로그 목록을 조회합니다. (OWNER, ADMIN만 접근 가능)',
  })
  @ApiResponse({
    status: 200,
    description: '감사 로그 목록 조회 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음 (OWNER, ADMIN만 접근 가능)',
  })
  async findAll(
    @Query() query: QueryAuditLogDto,
    @CurrentUser() user: { tenantId: string },
  ) {
    return await this.auditService.findAll(query, user.tenantId);
  }

  @Get('entity/:entityType/:entityId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '특정 엔티티의 감사 로그 조회',
    description: '특정 엔티티(Task, Meeting, Contract 등)의 모든 감사 로그를 조회합니다.',
  })
  @ApiParam({
    name: 'entityType',
    description: '엔티티 타입',
    example: 'task',
    enum: ['task', 'meeting', 'contract', 'user', 'auth'],
  })
  @ApiParam({
    name: 'entityId',
    description: '엔티티 ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: '특정 엔티티 감사 로그 조회 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  async getByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @CurrentUser() user: { tenantId: string },
  ) {
    return await this.auditService.getByEntity(entityType, entityId, user.tenantId);
  }

  @Get('timeline/:entityType/:entityId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '특정 엔티티의 타임라인 조회',
    description: '특정 엔티티의 변경 이력을 타임라인 형식으로 조회합니다. 변경 전/후 값의 차이를 포함합니다.',
  })
  @ApiParam({
    name: 'entityType',
    description: '엔티티 타입',
    example: 'task',
    enum: ['task', 'meeting', 'contract', 'user', 'auth'],
  })
  @ApiParam({
    name: 'entityId',
    description: '엔티티 ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: '타임라인 조회 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  async getTimeline(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @CurrentUser() user: { tenantId: string },
  ) {
    return await this.auditService.getTimeline(entityType, entityId, user.tenantId);
  }

  @Get('user/:userId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '특정 사용자의 활동 로그 조회',
    description: '특정 사용자의 최근 활동 로그를 조회합니다. (최근 100개)',
  })
  @ApiParam({
    name: 'userId',
    description: '사용자 ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 활동 로그 조회 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  async getUserActivity(
    @Param('userId') userId: string,
    @CurrentUser() user: { tenantId: string },
  ) {
    return await this.auditService.getUserActivity(userId, user.tenantId);
  }
}
