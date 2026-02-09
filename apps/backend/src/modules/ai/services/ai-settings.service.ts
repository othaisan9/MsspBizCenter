import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiSettings } from '../entities/ai-settings.entity';
import { EncryptionService } from '../../contracts/services/encryption.service';
import { UpdateAiSettingsDto } from '../dto/ai-settings.dto';

@Injectable()
export class AiSettingsService {
  constructor(
    @InjectRepository(AiSettings)
    private readonly aiSettingsRepository: Repository<AiSettings>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async getSettings(tenantId: string): Promise<AiSettings> {
    let settings = await this.aiSettingsRepository.findOne({
      where: { tenantId },
    });

    if (!settings) {
      // 기본값으로 새로 생성
      settings = this.aiSettingsRepository.create({
        tenantId,
        provider: 'anthropic',
        defaultModel: 'claude-sonnet-4-5-20250929',
        fastModel: 'claude-haiku-4-5-20251001',
        isEnabled: false,
        ollamaBaseUrl: 'http://localhost:11434',
      });
      settings = await this.aiSettingsRepository.save(settings);
    }

    return settings;
  }

  async updateSettings(
    tenantId: string,
    dto: UpdateAiSettingsDto,
  ): Promise<AiSettings> {
    let settings = await this.aiSettingsRepository.findOne({
      where: { tenantId },
    });

    if (!settings) {
      settings = this.aiSettingsRepository.create({ tenantId });
    }

    // 업데이트할 필드 적용
    if (dto.provider !== undefined) settings.provider = dto.provider;
    if (dto.defaultModel !== undefined) settings.defaultModel = dto.defaultModel;
    if (dto.fastModel !== undefined) settings.fastModel = dto.fastModel;
    if (dto.isEnabled !== undefined) settings.isEnabled = dto.isEnabled;
    if (dto.monthlyBudgetLimit !== undefined) settings.monthlyBudgetLimit = dto.monthlyBudgetLimit;
    if (dto.ollamaBaseUrl !== undefined) settings.ollamaBaseUrl = dto.ollamaBaseUrl;

    // API 키는 암호화하여 저장
    if (dto.apiKey !== undefined && dto.apiKey.trim() !== '') {
      settings.apiKeyEncrypted = this.encryptionService.encrypt(dto.apiKey);
    }

    return await this.aiSettingsRepository.save(settings);
  }

  async getDecryptedApiKey(tenantId: string): Promise<string | null> {
    const settings = await this.getSettings(tenantId);

    if (!settings.apiKeyEncrypted) {
      return null;
    }

    try {
      return this.encryptionService.decrypt(settings.apiKeyEncrypted);
    } catch (error) {
      throw new Error('API 키 복호화에 실패했습니다. 설정을 다시 확인해주세요.');
    }
  }

  async isAiEnabled(tenantId: string): Promise<boolean> {
    const settings = await this.getSettings(tenantId);
    return settings.isEnabled;
  }

  /**
   * API 키를 마스킹하여 반환 (보안)
   */
  maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '****';
    }
    return apiKey.substring(0, 7) + '****';
  }
}
