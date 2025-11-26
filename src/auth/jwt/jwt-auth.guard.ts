// src/auth/jwt/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Authorization 헤더에서 토큰 추출
    let token = request.headers.authorization?.replace('Bearer ', '');
    
    // 헤더에 토큰이 없으면 쿠키에서 확인 (PC 클라이언트용)
    if (!token && request.cookies) {
      token = request.cookies.access_token;
    }

    if (!token) {
      throw new UnauthorizedException('do_not_match_token');
    }

    try {
      const decoded = this.authService.verifyToken(token);
      request.user = decoded; // 요청 객체에 user 정보 추가
      return true;
    } catch (err) {
      if (err.message === 'Expired_token') {
        throw new UnauthorizedException('Expired_token');
      }
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
}
