import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService : ConfigService
  ) {}

  // Access JWT 토큰 생성
  createAccessToken(user: any): string {
    try {
      const secret = this.configService.get<string>('DEV_JWT_SECRET_KEY');

      // 정상 운영: 1시간 만료
      return this.jwtService.sign(user, {secret, expiresIn: '1h'});

    } catch (err) {
      console.log(err);
      throw new UnauthorizedException('do_not_match_server');
    }
  }

  createRefreshToken(user : any) : string {
    try {
      const secret = this.configService.get<string>('DEV_JWT_SECRET_KEY');

      return this.jwtService.sign(user, {secret, expiresIn: '1d'});

    } catch (err) {
      console.log(err);
      throw new UnauthorizedException('do_not_match_server');
    }
  }

  // JWT 토큰 검증
  verifyToken(token: string) {
    try {
      const secret = this.configService.get<string>('DEV_JWT_SECRET_KEY');
      // console.log('🔑 토큰 검증 시작:', { secret: secret?.substring(0, 10) + '...', tokenLength: token.length });
      
      const result = this.jwtService.verify(token, {secret});
      // console.log('✅ 토큰 검증 성공:', { user_id: result.user_id, exp: new Date(result.exp * 1000) });
      
      return result;
    } catch (err) {
      // console.log('❌ 토큰 검증 실패:', { name: err.name, message: err.message });
      
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Expired_token');
      }
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  // decode만 필요할 때
  decodeToken(token: string) {
    return this.jwtService.decode(token);
  }
}
