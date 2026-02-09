import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiSettingsController } from './ai-settings.controller';
import { AiService } from './ai.service';
import { AiSettingsService } from './services/ai-settings.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { AiSettings } from './entities/ai-settings.entity';
import { TasksModule } from '../tasks/tasks.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { StatsModule } from '../stats/stats.module';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiSettings]),
    TasksModule,
    MeetingsModule,
    StatsModule,
    ContractsModule, // EncryptionService를 위해 import
  ],
  controllers: [AiController, AiSettingsController],
  providers: [AiService, AiSettingsService, PromptBuilderService],
  exports: [AiService, AiSettingsService],
})
export class AiModule {}
