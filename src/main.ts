import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/http-exceptionFilter';
import { ActivityLogInterceptor } from './common/activity-log.interceptor';
import { DatabaseService } from './database/database.service';
import cookieParser from 'cookie-parser';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 프록시 환경에서 클라이언트 IP 제대로 받기 (Nginx 등 리버스 프록시 대응)
  // 운영 환경에서는 환경변수로 제어 가능
  const trustProxy = process.env.TRUST_PROXY || 'true';
  app.getHttpAdapter().getInstance().set('trust proxy', trustProxy === 'true');
  
  // 쿠키 파서 미들웨어 등록 (PC 클라이언트 토큰 읽기용)
  app.use(cookieParser());

   app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // DTO에 정의되지 않은 필드는 자동 제거
      forbidNonWhitelisted: true,   // DTO에 없는 필드가 오면 에러 발생
      transform: true,              // 요청 데이터를 DTO 타입으로 변환
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter);
  
  // Activity Log Interceptor를 전역으로 등록
  const databaseService = app.get(DatabaseService);
  app.useGlobalInterceptors(new ActivityLogInterceptor(databaseService));
  
  // app.set
  await app.listen(process.env.PORT ?? 9090, '0.0.0.0');
}
bootstrap();
