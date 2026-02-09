import { IsOptional, IsString, IsBoolean, IsNumber, IsIn, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAiSettingsDto {
  @ApiPropertyOptional({
    description: 'AI 제공자',
    enum: ['anthropic', 'openai', 'ollama'],
    example: 'anthropic'
  })
  @IsOptional()
  @IsIn(['anthropic', 'openai', 'ollama'])
  provider?: string;

  @ApiPropertyOptional({
    description: 'API 키 (평문 전송, 서버에서 암호화)',
    example: 'sk-ant-...'
  })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({
    description: '기본 모델',
    example: 'claude-sonnet-4-5-20250929'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  defaultModel?: string;

  @ApiPropertyOptional({
    description: '빠른 모델 (간단한 작업용)',
    example: 'claude-haiku-4-5-20251001'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fastModel?: string;

  @ApiPropertyOptional({
    description: 'AI 기능 활성화 여부',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: '월간 예산 한도 (USD)',
    example: 100.00
  })
  @IsOptional()
  @IsNumber()
  monthlyBudgetLimit?: number;

  @ApiPropertyOptional({
    description: 'Ollama 서버 URL',
    example: 'http://localhost:11434'
  })
  @IsOptional()
  @IsString()
  ollamaBaseUrl?: string;
}
