// src/modules/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PoolConnection } from 'mysql2/promise';
import { SignUpDto } from './dto/signUp.dto';

@Injectable()
export class CommonRepository {
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

  async findNickName(nickName : String) {
    const sql = `
    SELECT nick_name
    FROM user
    WHERE nick_name = ?`;
    const result = await this.db.query(sql, [nickName]);
    return result[0];
  }

  async findUserPhone(phone : String) {
    const sql = `
    SELECT phone
    FROM user
    WHERE phone = ?`;
    const result = await this.db.query(sql, [phone]);
    return result[0];
  }

  async findUserOne(uuid : String) {
    const sql = `
    SELECT A.id,
           A.uuid,
           A.user_name, 
           A.phone, 
           A.nick_name, 
           B.img AS insignia_img, 
           A.user_level, 
           C.level_name, 
           A.user_status, 
           (SELECT IFNULL(SUM(E.total_exp),0) FROM user_exp_transaction E WHERE E.user_id = A.id) AS user_exp, 
           A.point, 
           A.img, 
           A.is_deleted, 
           A.password, 
           A.password_hash_key, 
           (SELECT COUNT(D.id) FROM user_notification D WHERE D.user_id = A.id AND D.read_yn = 'N' AND D.status = 'active') AS noti_count
    FROM user A
    LEFT JOIN insignia B ON A.insignia_level = B.insignia_level
    LEFT JOIN level C ON A.user_level = C.level_code
    WHERE A.uuid = ?
    AND A.is_deleted = 0`;
    const result = await this.db.query(sql, [uuid]);
    return result;
  }

  async findUserFollower(user_id : Number) {
    const sql = `
    SELECT COUNT(A.id) AS count
    FROM follow A
    LEFT JOIN user_block K ON K.user_id = ? AND K.block_user_id = A.user_id
    LEFT JOIN user_block UB2 ON UB2.user_id = A.user_id AND UB2.block_user_id = ?
    JOIN user U ON U.id = A.following_id AND U.is_deleted = 0
    WHERE A.following_id = ?
    AND A.is_followed = 1
    AND K.block_user_id IS NULL
    AND UB2.block_user_id IS NULL`;
    const result = await this.db.query(sql, [user_id, user_id, user_id]);
    return result[0];
  }

  async findUserFollowing(user_id : Number) {
    const sql = `
    SELECT COUNT(A.id) AS count
    FROM follow A
    LEFT JOIN user_block K ON K.user_id = ? AND K.block_user_id = A.following_id
    LEFT JOIN user_block UB2 ON UB2.user_id = A.following_id AND UB2.block_user_id = ?
    JOIN user U ON U.id = A.user_id AND U.is_deleted = 0
    WHERE A.user_id = ?
    AND A.is_followed = 1
    AND K.block_user_id IS NULL  
    AND UB2.block_user_id IS NULL`;
    const result = await this.db.query(sql, [user_id, user_id, user_id]);
    return result[0];
  }

  async updateUserFcmToken(fcm_token : String) {
    const sql = `
    UPDATE user_session
    SET fcm_token = NULL
    WHERE fcm_token = ?;`
    await this.db.query(sql, [fcm_token]);
  }

  async insertUserSession(session_parameter : any) {
    const user_id = session_parameter.user_id;
    const device_type = session_parameter.device_type;
    const device_os = session_parameter?.device_os || null;
    const session = session_parameter?.session || null;
    const refresh_session = session_parameter?.refresh_session || null;
    const fcm_token = session_parameter?.fcm_token || null;

    const sql = `
    INSERT INTO user_session (user_id, device_type, device_os, session, refresh_session, fcm_token)
    VALUES(?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE device_os = ?, session = ?, refresh_session = ?, fcm_token = ?`
    await this.db.query(sql, [
      user_id, device_type, device_os, session, refresh_session, fcm_token,
      device_os, session, refresh_session, fcm_token
    ])
  }

  async updateUserFcmTokenWithConnection(connection: PoolConnection, fcm_token: string) {
    const sql = `
    UPDATE user_session
    SET fcm_token = NULL
    WHERE fcm_token = ?;`
    const [result] = await connection.execute(sql, [fcm_token]);
    return result;
  }

  async insertUserSessionWithConnection(connection: PoolConnection, session_parameter: any) {
    const user_id = session_parameter.user_id;
    const device_type = session_parameter.device_type;
    const device_os = session_parameter?.device_os || null;
    const session = session_parameter?.session || null;
    const refresh_session = session_parameter?.refresh_session || null;
    const fcm_token = session_parameter?.fcm_token || null;

    const sql = `
    INSERT INTO user_session (user_id, device_type, device_os, session, refresh_session, fcm_token)
    VALUES(?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE device_os = ?, session = ?, refresh_session = ?, fcm_token = ?`
    
    const [result] = await connection.execute(sql, [
      user_id, device_type, device_os, session, refresh_session, fcm_token,
      device_os, session, refresh_session, fcm_token
    ]);
    return result;
  }

  // 트랜잭션으로 FCM 토큰 업데이트와 세션 삽입을 함께 처리
  async updateFcmTokenAndInsertSession(session_parameter: any) {
    return await this.db.transaction(async (connection) => {
      // FCM 토큰이 있는 경우에만 기존 토큰을 NULL로 업데이트
      if (session_parameter.fcm_token) {
        await this.updateUserFcmTokenWithConnection(connection, session_parameter.fcm_token);
      }
      
      // 새로운 세션 정보 삽입/업데이트
      await this.insertUserSessionWithConnection(connection, session_parameter);
    });
  }

  async insertPhoneAuthCode(phone : String, auth_code : String) {
    const sql = `
    INSERT INTO auth_code (user_phone, code)
    VALUES(?,?)
    ON DUPLICATE KEY UPDATE code = ?`;
    const result = await this.db.query(sql, [phone, auth_code, auth_code]);
    return result[0];
  }

  async findPhoneAuthCode(phone : String) {
    const sql = `
    SELECT user_phone, code
    FROM auth_code
    WHERE user_phone = ?`;
    const result = await this.db.query(sql, [phone]);
    return result[0];
  }

  async findReferrerUuid(referrer : String) {
    const sql = `
    SELECT uuid
    FROM user
    WHERE uuid = ?
    AND is_deleted = 0`;
    const result = await this.db.query(sql, [referrer]);
    return result[0];
  }

  async insertPointTransaction(connection: PoolConnection, user_id : Number, type : String, point : Number) {
    const sql = `
    INSERT INTO user_point_transaction(user_id, date, type, count, total_point)
    VALUES (?,CURDATE(),?,?,?)
    ON DUPLICATE KEY UPDATE 
    count = count + VALUES(count),
    total_point = total_point + VALUES(total_point)`
    const [result] = await connection.execute(sql, [user_id, type, 1, point]);
    return result;
  }

  async insertPointHistory(connection: PoolConnection, user_id : Number, type : String, point : Number) {
    const sql = `
    INSERT INTO user_point_history(user_id, point_type, type, point)
    VALUES (?,?,?,?)`;
    const [result] = await connection.execute(sql, [user_id, 'earn', type, point]);
    return result;
  }

  async insertUserData(signUpDto : SignUpDto, referrerId : Number) {

    console.log(signUpDto);
    console.log(referrerId);
  }

  // 트랜잭션으로 유저 포인트 업데이트(Transaction, History)
  async insertSignUp(parameter : any) {
    return await this.db.transaction(async (connection) => {

      // const referrer = parameter.referrer;
      // const user_id = parameter.user_id;
      // const type = parameter.type;
      // const point = parameter.point;

      // if(referrer) {
      //   // 추천인에게 포인트 지급. 근데 나한테도 보내줘야하기 때문에 회원가입 후 InsertId로 본인 지급 로직 필요.
      //   await this.insertPointTransaction(connection, user_id, type, point)
      //   await this.insertPointHistory(connection, user_id, type, point);
      // }

    });
  }
}
