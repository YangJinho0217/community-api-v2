// src/modules/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PoolConnection } from 'mysql2/promise';

@Injectable()
export class SearchRpository {
  constructor(private readonly db: DatabaseService) {}

  // 모든 사용자 조회
  async findAll() {
    const sql = 'SELECT uuid FROM user';
    return this.db.query(sql);
  }

  async findUserCurrentSearch(user_id : Number) {
    const sql = `
    SELECT search
    FROM (
        SELECT search, created_at,
            ROW_NUMBER() OVER (PARTITION BY search ORDER BY created_at DESC) AS rn
        FROM user_search
        WHERE user_id = ?
    ) AS ranked
    WHERE rn = 1
    ORDER BY created_at DESC
    LIMIT 10`;
    const result = await this.db.query(sql, [user_id]);
    return result;
  }

  async findPopularSearch(scheme : String) {
    const sql = `
    SELECT ROW_NUMBER() OVER (ORDER BY ranks ASC) AS seq
         , ranks
         , search
         , diff
    FROM ${scheme}.search_stat
    WHERE timestamp = (SELECT MAX(timestamp) FROM ${scheme}.search_stat)
    AND is_deleted = 0
    ORDER BY ranks ASC
    LIMIT 10`;
    
    const result = await this.db.query(sql, []);
    return result;
  }

}
