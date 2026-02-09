import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AiSettingsService } from './services/ai-settings.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { TasksService } from '../tasks/tasks.service';
import { MeetingsService } from '../meetings/meetings.service';
import { StatsService } from '../stats/stats.service';
import { LlmProvider } from './providers/llm-provider.interface';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { OllamaProvider } from './providers/ollama.provider';
import {
  GenerateTaskDescDto,
  SummarizeMeetingDto,
  ExtractActionItemsDto,
  GenerateMeetingTemplateDto,
  WeeklyReportDto,
  ChatDto,
} from './dto/generate.dto';

@Injectable()
export class AiService {
  constructor(
    private readonly aiSettingsService: AiSettingsService,
    private readonly promptBuilderService: PromptBuilderService,
    private readonly tasksService: TasksService,
    private readonly meetingsService: MeetingsService,
    private readonly statsService: StatsService,
  ) {}

  private async getProvider(tenantId: string): Promise<{ provider: LlmProvider; settings: any }> {
    const settings = await this.aiSettingsService.getSettings(tenantId);

    if (!settings.isEnabled) {
      throw new BadRequestException('AI 기능이 비활성화되어 있습니다. 설정에서 활성화해주세요.');
    }

    let provider: LlmProvider;

    if (settings.provider === 'ollama') {
      provider = new OllamaProvider(settings.ollamaBaseUrl || 'http://localhost:11434');
    } else {
      const apiKey = await this.aiSettingsService.getDecryptedApiKey(tenantId);
      if (!apiKey) {
        throw new BadRequestException('API 키가 설정되지 않았습니다. AI 설정에서 API 키를 등록해주세요.');
      }

      if (settings.provider === 'anthropic') {
        provider = new AnthropicProvider(apiKey);
      } else if (settings.provider === 'openai') {
        provider = new OpenAiProvider(apiKey);
      } else {
        throw new BadRequestException(`지원하지 않는 AI 제공자입니다: ${settings.provider}`);
      }
    }

    return { provider, settings };
  }

  async generateTaskDescription(tenantId: string, dto: GenerateTaskDescDto): Promise<{ description: string }> {
    const { provider, settings } = await this.getProvider(tenantId);
    const prompt = this.promptBuilderService.buildTaskDescPrompt(dto.title, dto.tags, dto.priority);

    const response = await provider.generate({
      model: settings.fastModel,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
      maxTokens: 2000,
    });

    return { description: response.text };
  }

  async summarizeMeeting(tenantId: string, dto: SummarizeMeetingDto, userId: string): Promise<{ summary: string }> {
    const meeting = await this.meetingsService.findOne(dto.meetingId, tenantId);
    if (!meeting) {
      throw new NotFoundException('회의록을 찾을 수 없습니다.');
    }

    const { provider, settings } = await this.getProvider(tenantId);

    const attendeeNames = meeting.attendees?.map(a => a.user?.name).filter(Boolean) || [];
    const prompt = this.promptBuilderService.buildMeetingSummaryPrompt(meeting.content || '', attendeeNames);

    const response = await provider.generate({
      model: settings.defaultModel,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
      maxTokens: 3000,
    });

    return { summary: response.text };
  }

  async *streamMyPerformance(tenantId: string, userId: string): AsyncGenerator<string, void, unknown> {
    const { provider, settings } = await this.getProvider(tenantId);

    // 최근 업무 가져오기 (최대 50개)
    const tasksData = await this.tasksService.findAll(
      { page: 1, limit: 50, assigneeId: userId },
      tenantId,
    );

    const prompt = this.promptBuilderService.buildMyPerformancePrompt(tasksData.data);

    const stream = provider.stream({
      model: settings.fastModel,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
      maxTokens: 3000,
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }

  async *streamWeeklyReport(tenantId: string, dto: WeeklyReportDto): AsyncGenerator<string, void, unknown> {
    const { provider, settings } = await this.getProvider(tenantId);

    // 해당 주의 모든 업무 가져오기
    const tasksData = await this.tasksService.findAll(
      { page: 1, limit: 200, weekNumber: dto.weekNumber, year: dto.year },
      tenantId,
    );

    const prompt = this.promptBuilderService.buildWeeklyReportPrompt(tasksData.data, dto.year, dto.weekNumber);

    const stream = provider.stream({
      model: settings.defaultModel,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
      maxTokens: 4000,
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }

  async extractActionItems(
    tenantId: string,
    dto: ExtractActionItemsDto,
  ): Promise<{ actionItems: any[] }> {
    const meeting = await this.meetingsService.findOne(dto.meetingId, tenantId);
    if (!meeting) {
      throw new NotFoundException('회의록을 찾을 수 없습니다.');
    }

    const { provider, settings } = await this.getProvider(tenantId);

    // agenda를 문자열로 변환
    const agendaStr = meeting.agenda
      ? meeting.agenda.map((item) => `- ${item.title}${item.description ? `: ${item.description}` : ''}`).join('\n')
      : undefined;

    const prompt = this.promptBuilderService.buildActionItemExtractionPrompt(
      meeting.content || '',
      agendaStr,
    );

    const response = await provider.generate({
      model: settings.fastModel,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
      maxTokens: 2000,
    });

    // JSON 파싱
    try {
      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return { actionItems: [] };
      }
      const actionItems = JSON.parse(jsonMatch[0]);
      return { actionItems: Array.isArray(actionItems) ? actionItems : [] };
    } catch (error) {
      throw new BadRequestException('Action Items 추출에 실패했습니다. 응답 형식이 올바르지 않습니다.');
    }
  }

  async generateMeetingTemplate(
    tenantId: string,
    dto: GenerateMeetingTemplateDto,
  ): Promise<{ template: string }> {
    const { provider, settings } = await this.getProvider(tenantId);

    const prompt = this.promptBuilderService.buildMeetingTemplatePrompt(
      dto.title,
      dto.type,
      dto.attendeeCount,
    );

    const response = await provider.generate({
      model: settings.fastModel,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
      maxTokens: 2500,
    });

    return { template: response.text };
  }

  async *streamChat(
    tenantId: string,
    userId: string,
    dto: ChatDto,
  ): AsyncGenerator<string, void, unknown> {
    const { provider, settings } = await this.getProvider(tenantId);

    let contextData: any = {};

    // 컨텍스트 타입에 따라 관련 데이터 조회
    if (dto.contextType === 'my-tasks') {
      const tasksData = await this.tasksService.findAll(
        { page: 1, limit: 20, assigneeId: userId },
        tenantId,
      );
      contextData.tasks = tasksData.data;
    }

    const prompt = this.promptBuilderService.buildChatPrompt(dto.message, contextData);

    const stream = provider.stream({
      model: settings.fastModel,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
      maxTokens: 3000,
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }
}
