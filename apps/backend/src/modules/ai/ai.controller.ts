import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import {
  GenerateTaskDescDto,
  SummarizeMeetingDto,
  ExtractActionItemsDto,
  GenerateMeetingTemplateDto,
  WeeklyReportDto,
  ExtractWeeklyTasksDto,
  ChatDto,
  ListModelsDto,
} from './dto/generate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@msspbiz/shared';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('models')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: '프로바이더 모델 목록 조회 (ADMIN 이상)' })
  @ApiResponse({ status: 200, description: '모델 목록 조회 성공' })
  listModels(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: ListModelsDto,
  ) {
    return this.aiService.listModels(tenantId, dto);
  }

  @Post('generate-task-desc')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: '업무 설명 생성 (AI)' })
  @ApiResponse({ status: 200, description: '업무 설명 생성 성공' })
  @ApiResponse({ status: 400, description: 'AI 기능 비활성화 또는 API 키 미설정' })
  async generateTaskDescription(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: GenerateTaskDescDto,
  ) {
    return await this.aiService.generateTaskDescription(tenantId, dto);
  }

  @Post('generate-meeting-template')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: '회의 템플릿 생성 (AI)' })
  @ApiResponse({ status: 200, description: '회의 템플릿 생성 성공' })
  async generateMeetingTemplate(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: GenerateMeetingTemplateDto,
  ) {
    return await this.aiService.generateMeetingTemplate(tenantId, dto);
  }

  @Post('summarize-meeting')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: '회의록 요약 (AI)' })
  @ApiResponse({ status: 200, description: '회의록 요약 성공' })
  @ApiResponse({ status: 404, description: '회의록을 찾을 수 없음' })
  async summarizeMeeting(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SummarizeMeetingDto,
  ) {
    return await this.aiService.summarizeMeeting(tenantId, dto, userId);
  }

  @Post('my-performance')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST, UserRole.VIEWER)
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @ApiOperation({ summary: '내 성과 분석 (AI, SSE 스트리밍)' })
  @ApiResponse({ status: 200, description: '성과 분석 스트리밍 시작' })
  async streamMyPerformance(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      for await (const chunk of this.aiService.streamMyPerformance(tenantId, userId)) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }

  @Post('weekly-report')
  @Roles(UserRole.ANALYST, UserRole.ADMIN, UserRole.OWNER)
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @ApiOperation({ summary: '주간 보고서 생성 (AI, SSE 스트리밍, ANALYST 이상)' })
  @ApiResponse({ status: 200, description: '주간 보고서 스트리밍 시작' })
  async streamWeeklyReport(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: WeeklyReportDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      for await (const chunk of this.aiService.streamWeeklyReport(tenantId, dto)) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }

  @Post('extract-weekly-tasks')
  @Roles(UserRole.ANALYST, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: '주간 보고서에서 다음 주 업무 추출 (AI)' })
  @ApiResponse({ status: 200, description: '업무 추출 성공' })
  async extractWeeklyTasks(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: ExtractWeeklyTasksDto,
  ) {
    return await this.aiService.extractWeeklyTasks(tenantId, dto);
  }

  @Post('extract-actions')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST, UserRole.VIEWER)
  @ApiOperation({ summary: 'Action Item 추출 (AI)' })
  @ApiResponse({ status: 200, description: 'Action Item 추출 성공' })
  @ApiResponse({ status: 404, description: '회의록을 찾을 수 없음' })
  async extractActionItems(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: ExtractActionItemsDto,
  ) {
    return await this.aiService.extractActionItems(tenantId, dto);
  }

  @Post('chat')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.ANALYST, UserRole.VIEWER)
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @ApiOperation({ summary: 'AI 채팅 (SSE 스트리밍)' })
  @ApiResponse({ status: 200, description: '채팅 스트리밍 시작' })
  async streamChat(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ChatDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      for await (const chunk of this.aiService.streamChat(tenantId, userId, dto)) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}
