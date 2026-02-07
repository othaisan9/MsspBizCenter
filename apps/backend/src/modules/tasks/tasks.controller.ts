import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, TaskStatus } from '@msspbiz/shared';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST)
  @ApiOperation({ summary: '작업 생성' })
  @ApiResponse({ status: 201, description: '작업이 성공적으로 생성되었습니다.' })
  @ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
  @ApiResponse({ status: 401, description: '인증되지 않았습니다.' })
  @ApiResponse({ status: 403, description: '권한이 없습니다.' })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.tasksService.create(createTaskDto, tenantId, userId);
  }

  @Get()
  @ApiOperation({ summary: '작업 목록 조회 (페이지네이션 + 필터링)' })
  @ApiResponse({ status: 200, description: '작업 목록을 성공적으로 조회했습니다.' })
  @ApiResponse({ status: 401, description: '인증되지 않았습니다.' })
  async findAll(
    @Query() query: QueryTaskDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return await this.tasksService.findAll(query, tenantId);
  }

  @Get('weekly')
  @ApiOperation({ summary: '주차별 작업 조회' })
  @ApiResponse({ status: 200, description: '주차별 작업을 성공적으로 조회했습니다.' })
  @ApiResponse({ status: 401, description: '인증되지 않았습니다.' })
  async findWeekly(
    @Query('year') year: number,
    @Query('week') week: number,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return await this.tasksService.findWeekly(year, week, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: '작업 상세 조회' })
  @ApiParam({ name: 'id', description: '작업 ID (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: '작업을 성공적으로 조회했습니다.' })
  @ApiResponse({ status: 404, description: '작업을 찾을 수 없습니다.' })
  @ApiResponse({ status: 401, description: '인증되지 않았습니다.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return await this.tasksService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST)
  @ApiOperation({ summary: '작업 수정' })
  @ApiParam({ name: 'id', description: '작업 ID (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: '작업이 성공적으로 수정되었습니다.' })
  @ApiResponse({ status: 404, description: '작업을 찾을 수 없습니다.' })
  @ApiResponse({ status: 401, description: '인증되지 않았습니다.' })
  @ApiResponse({ status: 403, description: '권한이 없습니다.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return await this.tasksService.update(id, updateTaskDto, tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: '작업 삭제' })
  @ApiParam({ name: 'id', description: '작업 ID (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: '작업이 성공적으로 삭제되었습니다.' })
  @ApiResponse({ status: 404, description: '작업을 찾을 수 없습니다.' })
  @ApiResponse({ status: 401, description: '인증되지 않았습니다.' })
  @ApiResponse({ status: 403, description: '권한이 없습니다.' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    await this.tasksService.remove(id, tenantId);
    return { success: true, message: 'Task deleted successfully' };
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST)
  @ApiOperation({ summary: '작업 상태 변경' })
  @ApiParam({ name: 'id', description: '작업 ID (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: '작업 상태가 성공적으로 변경되었습니다.' })
  @ApiResponse({ status: 404, description: '작업을 찾을 수 없습니다.' })
  @ApiResponse({ status: 401, description: '인증되지 않았습니다.' })
  @ApiResponse({ status: 403, description: '권한이 없습니다.' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: TaskStatus,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return await this.tasksService.updateStatus(id, status, tenantId);
  }

  @Patch(':id/assign')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST)
  @ApiOperation({ summary: '작업 담당자 할당' })
  @ApiParam({ name: 'id', description: '작업 ID (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: '담당자가 성공적으로 할당되었습니다.' })
  @ApiResponse({ status: 404, description: '작업을 찾을 수 없습니다.' })
  @ApiResponse({ status: 401, description: '인증되지 않았습니다.' })
  @ApiResponse({ status: 403, description: '권한이 없습니다.' })
  async assignTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('assigneeId', ParseUUIDPipe) assigneeId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return await this.tasksService.assignTask(id, assigneeId, tenantId);
  }
}
