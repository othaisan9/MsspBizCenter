import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet 보안 헤더
  app.use(helmet());

  // CORS 설정 (개발 환경에서는 모든 origin 허용)
  app.enableCors({
    origin: process.env.NODE_ENV === 'development' ? true : (process.env.CORS_ORIGIN || 'http://localhost:3001'),
    credentials: true,
  });

  // 글로벌 Exception Filter (프로덕션 스택 트레이스 차단)
  app.useGlobalFilters(new HttpExceptionFilter());

  // 글로벌 ValidationPipe 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API 글로벌 프리픽스
  app.setGlobalPrefix('api/v1', {
    exclude: ['api/docs(.*)'],
  });

  const port = process.env.PORT || 4001;

  // Swagger 설정 (프로덕션에서는 비활성화)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('MsspBizCenter API')
      .setDescription('MSSP 비즈니스 센터 Backend API 문서')
      .setVersion('0.1.0-alpha.7')
      .addBearerAuth()
      .addTag('auth', '인증 및 권한')
      .addTag('tasks', '주차별 업무 일지')
      .addTag('meetings', '회의록')
      .addTag('contracts', '계약 관리')
      .addTag('products', '제품 및 옵션 관리')
      .addTag('users', '사용자 관리')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);

  console.log(`🚀 MsspBizCenter Backend is running on: http://localhost:${port}`);
}
bootstrap();
