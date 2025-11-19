// src/common/hash/hash.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class HashService {

  constructor(private readonly configService: ConfigService) {}

  // 랜덤 Salt 생성
  generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  // 비밀번호 해시 생성 (Salt 필수)
  hashPassword(password: string, salt: string): string {
    return crypto.createHash('sha512').update(password + salt).digest('hex');
  }

  // 비밀번호 + Salt 해시 생성 (회원가입용)
  hashPasswordWithNewSalt(password: string): { hashedPassword: string; salt: string } {
    const salt = this.generateSalt();
    const hashedPassword = this.hashPassword(password, salt);
    return { hashedPassword, salt };
  }

  validatePassword(
    password: string,
    salt: string,
    hashedPasswordFromDB: string,
  ): boolean {
    try {
      const hash = this.hashPassword(password, salt);
      return hash === hashedPasswordFromDB;
    } catch (error) {
      // NestJS에서는 try/catch에서 Exception 던지기
      throw new InternalServerErrorException(error.message);
    }
  }
}
