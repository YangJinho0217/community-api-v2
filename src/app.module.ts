import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

// import { DatabaseM}

// Controller

// Service

// Module
import { CommonModule } from './module/common/common.module';
import { InitializeModule } from './module/initialize/initialize.module';

@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,  // ✅ 전역으로 사용 가능
      envFilePath: '.env', // 루트에 .env 파일이 있으면 생략 가능
    }),
    CommonModule,
    InitializeModule
  ],
  controllers: [AppController],
  providers: [AppService],
  
})
export class AppModule {}
