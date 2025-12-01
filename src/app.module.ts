import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ActivityLogInterceptor } from './common/activity-log.interceptor';
import { DatabaseModule } from './database/database.module';

// Module
import { CommonModule } from './module/common/common.module';
import { InitializeModule } from './module/initialize/initialize.module';
import { HomeModule } from './module/home/home.module';
import { SearchModule } from './module/search/search.module';
import { SportsService } from './module/sports/sports.service';
import { SportsModule } from './module/sports/sports.module';
import { AnalyzeController } from './module/analyze/analyze.controller';
import { AnalyzeService } from './module/analyze/analyze.service';
import { AnalyzeModule } from './module/analyze/analyze.module';

@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,  // ✅ 전역으로 사용 가능
      envFilePath: '.env', // 루트에 .env 파일이 있으면 생략 가능
    }),
    DatabaseModule,
    CommonModule,
    InitializeModule,
    HomeModule,
    SearchModule,
    SportsModule,
    AnalyzeModule
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    ActivityLogInterceptor
  ],
  
})
export class AppModule {}
