// src/auth/jwt/jwt.module.ts
import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [],
  providers: [JwtService, AuthService],
  exports: [JwtService],
})
export class JwtModule {}
