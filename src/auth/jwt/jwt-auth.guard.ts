// src/auth/jwt/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('do_not_match_token');
    }

    try {
      const decoded = this.jwtService.verify(token);
      request.user = decoded; // 요청 객체에 user 정보 추가
      return true;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Expired_token');
      }
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
}
