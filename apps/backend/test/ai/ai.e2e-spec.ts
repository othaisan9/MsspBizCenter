import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('AI Module (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // 로그인하여 JWT 토큰 획득 (실제 테스트 환경에 맞게 수정)
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.accessToken;
    tenantId = loginResponse.body.user.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('AI Settings', () => {
    it('GET /api/v1/ai/settings - AI 설정 조회', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('provider');
      expect(response.body).toHaveProperty('isEnabled');
    });

    it('PATCH /api/v1/ai/settings - AI 설정 업데이트', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/ai/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'anthropic',
          isEnabled: true,
          apiKey: 'sk-ant-test-key-12345',
        })
        .expect(200);

      expect(response.body.provider).toBe('anthropic');
      expect(response.body.isEnabled).toBe(true);
    });
  });

  describe('AI Generation', () => {
    it('POST /api/v1/ai/generate-task-desc - 업무 설명 생성', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ai/generate-task-desc')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'API 서버 성능 개선',
          tags: ['backend', 'performance'],
          priority: 'high',
        });

      // AI가 비활성화되어 있으면 400
      if (response.status === 400) {
        expect(response.body.message).toContain('AI 기능이 비활성화');
      } else {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('description');
      }
    });

    it('POST /api/v1/ai/generate-meeting-template - 회의 템플릿 생성', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ai/generate-meeting-template')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '주간 스프린트 회의',
          type: '정기회의',
          attendeeCount: 5,
        });

      if (response.status === 400) {
        expect(response.body.message).toContain('AI 기능이 비활성화');
      } else {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('template');
      }
    });
  });

  describe('AI Streaming', () => {
    it('POST /api/v1/ai/chat - AI 채팅 (SSE)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: '안녕하세요',
        });

      // SSE는 200 또는 400 (AI 비활성화)
      expect([200, 400]).toContain(response.status);
    });
  });
});
