import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

@Entity('ai_settings')
@Index(['tenantId'], { unique: true })
export class AiSettings extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 20, default: 'anthropic' })
  provider: string;

  @Column({ type: 'text', nullable: true, name: 'api_key_encrypted' })
  apiKeyEncrypted: string | null;

  @Column({ type: 'varchar', length: 100, default: 'claude-sonnet-4-5-20250929', name: 'default_model' })
  defaultModel: string;

  @Column({ type: 'varchar', length: 100, default: 'claude-haiku-4-5-20251001', name: 'fast_model' })
  fastModel: string;

  @Column({ type: 'boolean', default: false, name: 'is_enabled' })
  isEnabled: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'monthly_budget_limit' })
  monthlyBudgetLimit: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true, default: 'http://localhost:11434', name: 'ollama_base_url' })
  ollamaBaseUrl: string | null;
}
