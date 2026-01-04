// src/auth/jwt/jwt.module.ts
import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    NestJwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('DEV_JWT_SECRET_KEY'),
        signOptions: {
          expiresIn: '1h', // 기본 만료시간
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtService, AuthService],
  exports: [JwtService, AuthService],
})
export class JwtModule {}
