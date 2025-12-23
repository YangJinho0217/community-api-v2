// src/modules/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PoolConnection } from 'mysql2/promise';

@Injectable()
export class PortFolioRepository {
  constructor(private readonly db: DatabaseService) {}

  // 모든 사용자 조회
  async findAll() {
    const sql = 'SELECT uuid FROM user';
    return this.db.query(sql);
  }

  async insertUser(visitor_name : string) {
    const sql = `
    INSERT INTO portfolio_visitor (visitor_name)
    VALUES(?)`;
    await this.db.query(sql, [visitor_name]);
  }

}
