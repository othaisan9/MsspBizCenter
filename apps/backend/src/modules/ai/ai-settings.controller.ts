import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AiSettingsService } from './services/ai-settings.service';
import { UpdateAiSettingsDto } from './dto/ai-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@msspbiz/shared';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiSettingsController {
  constructor(private readonly aiSettingsService: AiSettingsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'AI 설정 조회 (OWNER, ADMIN만)' })
  @ApiResponse({ status: 200, description: 'AI 설정 조회 성공' })
  async getSettings(@CurrentUser('tenantId') tenantId: string) {
    const settings = await this.aiSettingsService.getSettings(tenantId);

    // API 키는 마스킹하여 반환
    const maskedSettings = {
      ...settings,
      apiKeyEncrypted: settings.apiKeyEncrypted
        ? this.aiSettingsService.maskApiKey(
            await this.aiSettingsService.getDecryptedApiKey(tenantId) || '',
          )
        : null,
    };

    return maskedSettings;
  }

  @Patch()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'AI 설정 수정 (OWNER, ADMIN만)' })
  @ApiResponse({ status: 200, description: 'AI 설정 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async updateSettings(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: UpdateAiSettingsDto,
  ) {
    const settings = await this.aiSettingsService.updateSettings(tenantId, dto);

    // API 키는 마스킹하여 반환
    return {
      ...settings,
      apiKeyEncrypted: settings.apiKeyEncrypted
        ? this.aiSettingsService.maskApiKey(
            await this.aiSettingsService.getDecryptedApiKey(tenantId) || '',
          )
        : null,
    };
  }
}
