// src/auth/jwt/optional-jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';

interface RequestWithUser extends Request {
  user?: any;
}

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService : AuthService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    
    // Authorization 헤더에서 토큰 추출
    let token = request.headers.authorization?.replace('Bearer ', '');

    // 헤더에 토큰이 없으면 쿠키에서 확인 (PC 클라이언트용)
    if (!token && request.cookies) {
      token = request.cookies.access_token;
    }

    // 토큰이 없으면 그냥 통과 (user는 null)
    if (!token) {
      request.user = null;
      return true;
    }

    try {
      const decoded = this.authService.verifyToken(token);
      request.user = decoded; // 요청 객체에 user 정보 추가
      return true;
    } catch (err) {
      console.log('토큰 검증 실패:', err.message);
      
      // 만료된 토큰은 에러로 처리하고 싶다면 주석 해제
      // if (err.message === 'Expired_token') {
      //   throw err;
      // }
      
      // 그 외의 경우는 null로 처리하고 통과
      request.user = null;
      return true;
    }
  }
}
