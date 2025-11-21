import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private readonly db: DatabaseService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // console.log('🔍 Activity Log Interceptor Run Sucess');
    
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url: path, headers } = request;
    
    // 특정 경로는 로깅에서 제외 (선택사항)
    const excludePaths = ['/health', '/metrics'];
    if (excludePaths.some(excludePath => path.includes(excludePath))) {
      console.log('⏭️ 제외된 경로, 로깅 건너뜀');
      return next.handle();
    }

    const getClientIp = (req: Request): string => {
      // X-Forwarded-For 헤더에서 가장 왼쪽(원본 클라이언트) IP 추출
      const forwarded = req.headers['x-forwarded-for'] as string | undefined;
      let ip = forwarded?.split(',')[0].trim() ||
               req.headers['x-real-ip'] as string ||
               req.headers['x-client-ip'] as string ||
               req.headers['cf-connecting-ip'] as string || // Cloudflare
               req.socket?.remoteAddress ||
               req.connection?.remoteAddress ||
               req.ip || // Express의 trust proxy 설정으로 처리된 IP
               'unknown';

      // IPv6 매핑된 IPv4 주소 정리 (::ffff:127.0.0.1 → 127.0.0.1)
      if (ip.startsWith('::ffff:')) {
        ip = ip.replace('::ffff:', '');
      }
      
    //   로컬호스트 주소들 정리
      if (ip === '::1') {
        ip = '127.0.0.1';
      }
      
      return ip;
    };

    const ip = getClientIp(request);
    
    // JWT에서 user_id 추출 (있는 경우)
    const user = (request as any).user;
    const user_id = user?.user_id || null;
    
    // User-Agent 헤더
    const user_agent = headers['user-agent'] || null;
    
    // 액션명 생성 (컨트롤러.메서드 형태)
    const handler = context.getHandler();
    const controller = context.getClass();
    const action = `${controller.name}.${handler.name}`;

    return next.handle().pipe(
      tap((data) => {
        // 응답 완료 후 비동기로 로그 저장
        this.saveActivityLog({
          user_id,
          action,
          method,
          path,
          ip: ip.toString(), // string으로 확실히 변환
          user_agent,
        }).catch(error => {
        //   console.error('❌ Activity log 저장 실패:', error);
        });
      }),
      tap({
        error: (error) => {
        //   console.error('💥 요청 처리 중 에러 발생:', error);
        },
        complete: () => {
        //   console.log('✅ Observable 완료됨');
        }
      })
    );
  }

  private async saveActivityLog(logData: {
    user_id: number | null;
    action: string;
    method: string;
    path: string;
    ip: string;
    user_agent: string | null;
  }) {
    try {
      const sql = `
        INSERT INTO activity_log (user_id, action, method, path, ip, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const result = await this.db.query(sql, [
        logData.user_id,
        logData.action,
        logData.method,
        logData.path,
        logData.ip,
        logData.user_agent,
      ]);
      
    //   console.log("✅ Activity Log DB 저장 성공:", result);
    } catch (error) {
      console.error("❌ Activity log DB 저장 에러:", error);
    }
  }
}
