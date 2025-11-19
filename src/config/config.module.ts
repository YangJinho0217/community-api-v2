// src/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 모든 모듈에서 import 없이 사용 가능
      envFilePath: '.env', // 기본값: '.env'
    }),
  ],
})
export class AppConfigModule {}