// src/common/hash/hash.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class HashService {
  hashPassword(password: string, salt: string): string {
    return crypto.createHash('sha512').update(password + salt).digest('hex');
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
