// src/modules/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PoolConnection } from 'mysql2/promise';

@Injectable()
export class InitializeRepository {
  constructor(private readonly db: DatabaseService) {}

  // 모든 사용자 조회
  async findAll() {
    const sql = 'SELECT uuid FROM user';
    return this.db.query(sql);
  }

  async findUserUuid(uuid : String) {
    const sql = `
    SELECT id
    FROM user
    WHERE uuid = ?`;
    const result = await this.db.query(sql, [uuid]);
    return result[0];
  }

  async findAppVersion(device_type : String, version : String) {
    const sql = `
    SELECT device_type,
           version,
           is_inspc
    FROM app_version
    WHERE device_type = ?
      AND version = ?`

    const result = await this.db.query(sql, [device_type, version]);
    return result[0];
  }

}
