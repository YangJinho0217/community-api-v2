import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import { ConfigService } from '@nestjs/config';
import { format } from 'sql-formatter';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('DEV_DB_HOST')!;
    const user = this.configService.get<string>('DEV_DB_USER')!;
    const password = this.configService.get<string>('DEV_DB_PASSWORD')!;
    const database = this.configService.get<string>('DEV_DB_DATABASE')!;

    this.pool = createPool({
      host,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
      decimalNumbers: true,
      timezone: '+09:00',
    });

    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      console.log('✅ DB Connection established successfully.');
    } catch (error) {
      console.error('❌ DB Connection failed:', error);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    console.log('DB Connection closed.');
  }

  // Raw Query 실행
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const [rows] = await this.pool.execute(sql, params);
    return rows as T[];
  }

  // 트랜잭션 시작
  async transaction<T>(callback: (conn: PoolConnection) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // 쿼리 로그 (선택적)
  logQuery(sql: string, params?: any[]) {
    const enableLog = this.configService.get<string>('ENABLE_QUERY_LOG') === 'true';
    if (enableLog) {
      const cleanedSql = sql.trim();
      const formattedSQL = format(cleanedSql, { language: 'mysql' });
      console.log('================ [SQL QUERY] ================');
      console.log(formattedSQL);
      if (params) console.log('[Bind Params]', params);
      console.log('==============================================');
    }
  }

  // Pool 직접 반환
  getPool(): Pool {
    return this.pool;
  }
}
