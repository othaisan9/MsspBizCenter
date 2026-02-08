import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
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
import { UsersService } from './users.service';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@msspbiz/shared';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: '사용자 목록 조회 (모든 역할 접근 가능)' })
  @ApiResponse({ status: 200, description: '사용자 목록 조회 성공' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() query: QueryUserDto,
  ) {
    return this.usersService.findAll(tenantId, query);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: '사용자 상세 조회 (모든 역할)' })
  @ApiParam({ name: 'id', description: '사용자 ID (UUID)' })
  @ApiResponse({ status: 200, description: '사용자 조회 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.usersService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: '사용자 수정 (OWNER, ADMIN만)' })
  @ApiParam({ name: 'id', description: '사용자 ID (UUID)' })
  @ApiResponse({ status: 200, description: '사용자 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 (자기 자신 role 변경 불가)' })
  @ApiResponse({ status: 403, description: '권한 없음 (OWNER만 ADMIN 역할 부여 가능)' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.update(id, tenantId, updateUserDto, {
      id: currentUser.id,
      role: currentUser.role,
    });
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: '사용자 비활성화 (OWNER만, isActive = false)' })
  @ApiParam({ name: 'id', description: '사용자 ID (UUID)' })
  @ApiResponse({ status: 200, description: '사용자 비활성화 성공' })
  @ApiResponse({ status: 400, description: '자기 자신 비활성화 불가' })
  @ApiResponse({ status: 403, description: '권한 없음 (OWNER만 가능)' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.usersService.deactivate(id, tenantId, currentUserId);
  }
}
