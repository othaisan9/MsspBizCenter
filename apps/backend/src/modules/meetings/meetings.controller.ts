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
} from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { QueryMeetingDto } from './dto/query-meeting.dto';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';
import { ManageAttendeeDto } from './dto/manage-attendee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@msspbiz/shared';

@ApiTags('meetings')
@ApiBearerAuth()
@Controller('meetings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST)
  @ApiOperation({ summary: '회의록 생성' })
  @ApiResponse({ status: 201, description: '회의록이 생성되었습니다.' })
  @ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
  @ApiResponse({ status: 401, description: '인증이 필요합니다.' })
  @ApiResponse({ status: 403, description: '권한이 없습니다.' })
  create(
    @Body() createMeetingDto: CreateMeetingDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.meetingsService.create(createMeetingDto, tenantId, userId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST, UserRole.SALES)
  @ApiOperation({ summary: '회의록 목록 조회' })
  @ApiResponse({ status: 200, description: '회의록 목록을 반환합니다.' })
  @ApiResponse({ status: 401, description: '인증이 필요합니다.' })
  findAll(
    @Query() query: QueryMeetingDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.meetingsService.findAll(query, tenantId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST, UserRole.SALES)
  @ApiOperation({ summary: '회의록 상세 조회' })
  @ApiResponse({ status: 200, description: '회의록 정보를 반환합니다.' })
  @ApiResponse({ status: 401, description: '인증이 필요합니다.' })
  @ApiResponse({ status: 404, description: '회의록을 찾을 수 없습니다.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.meetingsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST)
  @ApiOperation({ summary: '회의록 수정' })
  @ApiResponse({ status: 200, description: '회의록이 수정되었습니다.' })
  @ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
  @ApiResponse({ status: 401, description: '인증이 필요합니다.' })
  @ApiResponse({ status: 403, description: '권한이 없습니다.' })
  @ApiResponse({ status: 404, description: '회의록을 찾을 수 없습니다.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMeetingDto: UpdateMeetingDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.meetingsService.update(id, updateMeetingDto, tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: '회의록 삭제' })
  @ApiResponse({ status: 200, description: '회의록이 삭제되었습니다.' })
  @ApiResponse({ status: 401, description: '인증이 필요합니다.' })
  @ApiResponse({ status: 403, description: '권한이 없습니다.' })
  @ApiResponse({ status: 404, description: '회의록을 찾을 수 없습니다.' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.meetingsService.remove(id, tenantId);
  }

  @Patch(':id/publish')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: '회의록 발행' })
  @ApiResponse({ status: 200, description: '회의록이 발행되었습니다.' })
  @ApiResponse({ status: 400, description: '이미 발행된 회의록입니다.' })
  @ApiResponse({ status: 401, description: '인증이 필요합니다.' })
  @ApiResponse({ status: 403, description: '권한이 없습니다.' })
  @ApiResponse({ status: 404, description: '회의록을 찾을 수 없습니다.' })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.meetingsService.publish(id, tenantId);
  }

  @Post(':id/attendees')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST)
  @ApiOperation({ summary: '회의 참석자 추가' })
  @ApiResponse({ status: 201, description: '참석자가 추가되었습니다.' })
  @ApiResponse({ status: 400, description: '이미 등록된 참석자입니다.' })
  @ApiResponse({ status: 401, description: '인증이 필요합니다.' })
  @ApiResponse({ status: 403, description: '권한이 없습니다.' })
  @ApiResponse({ status: 404, description: '회의록을 찾을 수 없습니다.' })
  addAttendee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ManageAttendeeDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.meetingsService.addAttendee(id, dto, tenantId);
  }

  @Delete(':id/attendees/:userId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST)
  @ApiOperation({ summary: '회의 참석자 제거' })
  @ApiResponse({ status: 200, description: '참석자가 제거되었습니다.' })
  @ApiResponse({ status: 401, description: '인증이 필요합니다.' })
  @ApiResponse({ status: 403, description: '권한이 없습니다.' })
  @ApiResponse({ status: 404, description: '참석자를 찾을 수 없습니다.' })
  removeAttendee(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.meetingsService.removeAttendee(id, userId, tenantId);
  }

  @Post(':id/action-items')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST)
  @ApiOperation({ summary: 'Action Item 생성' })
  @ApiResponse({ status: 201, description: 'Action Item이 생성되었습니다.' })
  @ApiResponse({ status: 401, description: '인증이 필요합니다.' })
  @ApiResponse({ status: 403, description: '권한이 없습니다.' })
  @ApiResponse({ status: 404, description: '회의록을 찾을 수 없습니다.' })
  createActionItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateActionItemDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.meetingsService.createActionItem(id, dto, tenantId);
  }

  @Patch(':id/action-items/:itemId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST)
  @ApiOperation({ summary: 'Action Item 수정' })
  @ApiResponse({ status: 200, description: 'Action Item이 수정되었습니다.' })
  @ApiResponse({ status: 401, description: '인증이 필요합니다.' })
  @ApiResponse({ status: 403, description: '권한이 없습니다.' })
  @ApiResponse({ status: 404, description: 'Action Item을 찾을 수 없습니다.' })
  updateActionItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateActionItemDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.meetingsService.updateActionItem(id, itemId, dto, tenantId);
  }
}
