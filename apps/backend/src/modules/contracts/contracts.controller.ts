import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { QueryContractDto } from './dto/query-contract.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@msspbiz/shared';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: '계약 생성 (EDITOR 이상)' })
  @ApiResponse({ status: 201, description: '계약 생성 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  create(
    @Body() createContractDto: CreateContractDto,
    @CurrentUser() user: any,
  ) {
    return this.contractsService.create(
      createContractDto,
      user.tenantId,
      user.id,
    );
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: '계약 목록 조회 (EDITOR 이상)' })
  @ApiResponse({ status: 200, description: '계약 목록 조회 성공' })
  findAll(
    @Query() query: QueryContractDto,
    @CurrentUser() user: any,
  ) {
    return this.contractsService.findAll(query, user.tenantId);
  }

  @Get('dashboard')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: '계약 대시보드 (통계)' })
  @ApiResponse({ status: 200, description: '대시보드 조회 성공' })
  getDashboard(@CurrentUser() user: any) {
    return this.contractsService.getDashboard(user.tenantId);
  }

  @Get('expiring')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: '만료 예정 계약 목록' })
  @ApiQuery({ name: 'days', description: '만료 예정 일수', example: 30 })
  @ApiResponse({ status: 200, description: '만료 예정 계약 조회 성공' })
  getExpiring(
    @Query('days', ParseIntPipe) days: number,
    @CurrentUser() user: any,
  ) {
    return this.contractsService.getExpiring(days, user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({
    summary: '계약 상세 조회 (EDITOR 이상, 금액은 ADMIN 이상만 복호화)',
    description: 'EDITOR는 금액 제외한 정보만 조회 가능',
  })
  @ApiParam({ name: 'id', description: '계약 ID' })
  @ApiResponse({ status: 200, description: '계약 조회 성공' })
  @ApiResponse({ status: 404, description: '계약을 찾을 수 없음' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const contract = await this.contractsService.findOne(id, user.tenantId);

    // EDITOR는 금액 정보 제외
    if (user.role === UserRole.EDITOR) {
      const { amount, amountEncrypted, ...rest } = contract as any;
      return rest;
    }

    return contract;
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: '계약 수정 (EDITOR 이상)' })
  @ApiParam({ name: 'id', description: '계약 ID' })
  @ApiResponse({ status: 200, description: '계약 수정 성공' })
  @ApiResponse({ status: 404, description: '계약을 찾을 수 없음' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContractDto: UpdateContractDto,
    @CurrentUser() user: any,
  ) {
    return this.contractsService.update(
      id,
      updateContractDto,
      user.tenantId,
      user.id,
    );
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: '계약 삭제 (OWNER만 가능)' })
  @ApiParam({ name: 'id', description: '계약 ID' })
  @ApiResponse({ status: 200, description: '계약 삭제 성공' })
  @ApiResponse({ status: 403, description: '권한 없음 (OWNER만 가능)' })
  @ApiResponse({ status: 404, description: '계약을 찾을 수 없음' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    await this.contractsService.remove(id, user.tenantId);
    return { message: 'Contract deleted successfully' };
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: '계약 상태 변경 (EDITOR 이상)' })
  @ApiParam({ name: 'id', description: '계약 ID' })
  @ApiResponse({ status: 200, description: '상태 변경 성공' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.contractsService.updateStatus(
      id,
      updateStatusDto.status,
      user.tenantId,
      user.id,
    );
  }

  @Post(':id/renew')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({
    summary: '계약 갱신 (EDITOR 이상)',
    description: '기존 계약을 RENEWED 상태로 변경하고 새 계약 생성',
  })
  @ApiParam({ name: 'id', description: '갱신할 계약 ID' })
  @ApiResponse({ status: 201, description: '갱신된 새 계약 생성 성공' })
  @ApiResponse({ status: 400, description: '이미 갱신된 계약' })
  renew(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.contractsService.renew(id, user.tenantId, user.id);
  }

  @Get(':id/history')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: '계약 변경 이력 조회 (EDITOR 이상)' })
  @ApiParam({ name: 'id', description: '계약 ID' })
  @ApiResponse({ status: 200, description: '변경 이력 조회 성공' })
  getHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.contractsService.getHistory(id, user.tenantId);
  }
}
