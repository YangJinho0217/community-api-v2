// src/modules/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PoolConnection } from 'mysql2/promise';

@Injectable()
export class SportsRepository {
  constructor(private readonly db: DatabaseService) {}

  // 모든 사용자 조회
  async findAll() {
    const sql = 'SELECT uuid FROM user';
    return this.db.query(sql);
  }

  async findDailySports(
    user_id : number | 0,
    queryStartDate : string | '',
    queryEndDate : string | '',
    category: string,
    filter : string,
    page_no : number | 1,
    limit : number | 10) {

        console.log(user_id);
        console.log(queryStartDate);
        console.log(queryEndDate);
        console.log(category);
        console.log(filter);
        console.log(page_no);
        console.log(limit);
  }
}
