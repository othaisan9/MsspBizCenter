import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@msspbiz/shared';

@ApiTags('tags')
@ApiBearerAuth()
@Controller('tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: '태그 목록 조회 (모든 사용자)' })
  @ApiResponse({ status: 200, description: '태그 목록 조회 성공' })
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.tagsService.findAll(tenantId);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: '태그 생성 (ADMIN 이상)' })
  @ApiResponse({ status: 201, description: '태그 생성 성공' })
  @ApiResponse({ status: 409, description: '태그 이름 중복' })
  create(
    @Body() dto: CreateTagDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tagsService.create(dto, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: '태그 수정 (ADMIN 이상, 모든 업무의 태그명도 변경)' })
  @ApiParam({ name: 'id', description: '태그 ID' })
  @ApiResponse({ status: 200, description: '태그 수정 성공' })
  @ApiResponse({ status: 404, description: '태그를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '태그 이름 중복' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTagDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tagsService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: '태그 삭제 (ADMIN 이상, 모든 업무에서도 제거)' })
  @ApiParam({ name: 'id', description: '태그 ID' })
  @ApiResponse({ status: 200, description: '태그 삭제 성공' })
  @ApiResponse({ status: 404, description: '태그를 찾을 수 없음' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    await this.tagsService.remove(id, tenantId);
    return { message: '태그가 삭제되었습니다' };
  }
}
