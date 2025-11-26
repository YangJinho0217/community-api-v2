// src/modules/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PoolConnection } from 'mysql2/promise';
import { SignUpDto } from './dto/signUp.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';

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
    WHERE uuid = ?
    AND is_deleted = 0`;
    const result = await this.db.query(sql, [uuid]);
    return result[0];
  }

  async findNickName(nickName : String) {
    const sql = `
    SELECT nick_name
    FROM user
    WHERE nick_name = ?
    AND is_deleted = 0`;
    const result = await this.db.query(sql, [nickName]);
    return result[0];
  }

  async findUserPhone(phone : String) {
    const sql = `
    SELECT phone
    FROM user
    WHERE phone = ?
    AND is_deleted = 0`;
    const result = await this.db.query(sql, [phone]);
    return result[0];
  }

  async findUserOne(uuid : String) {
    const sql = `
    SELECT A.id,
           A.type AS user_type,
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

  async insertPointTransactionReferrer(connection: PoolConnection, parameter : any) {
    const sql = `
    INSERT INTO user_point_transaction(user_id, date, type, count, total_point)
    VALUES (?,CURDATE(),?,?,?)
    ON DUPLICATE KEY UPDATE 
    count = count + VALUES(count),
    total_point = total_point + VALUES(total_point)`
    const [result] = await connection.execute(sql, [parameter.referrer, parameter.point_type, 1, parameter.point]);
    return result;
  }

  async insertPointHistoryReferrer(connection: PoolConnection, parameter : any) {
    const sql = `
    INSERT INTO user_point_history(user_id, point_type, type, point)
    VALUES (?,?,?,?)`;
    const [result] = await connection.execute(sql, [parameter.referrer, 'earn', parameter.point_type, parameter.point]);
    return result;
  }

  async insertPointTransactionUser(connection: PoolConnection, parameter : any) {
    const sql = `
    INSERT INTO user_point_transaction(user_id, date, type, count, total_point)
    VALUES (?,CURDATE(),?,?,?)
    ON DUPLICATE KEY UPDATE 
    count = count + VALUES(count),
    total_point = total_point + VALUES(total_point)`
    const [result] = await connection.execute(sql, [parameter.user_id, parameter.point_type, 1, parameter.point]);
    return result;
  }

  async insertPointHistoryUser(connection: PoolConnection, parameter : any) {
    const sql = `
    INSERT INTO user_point_history(user_id, point_type, type, point)
    VALUES (?,?,?,?)`;
    const [result] = await connection.execute(sql, [parameter.user_id, 'earn', parameter.point_type, parameter.point]);
    return result;
  }

  async insertUserData(connection : PoolConnection, parameter : any) {

    // console.log(parameter);
    // return 1;
    const sql = `
    INSERT INTO user
    (
      type,
      uuid,
      user_name,
      phone,
      nick_name,
      password,
      password_hash_key,
      user_level,
      user_status,
      referrer,
      insignia_level,
      terms,
      privacy,
      location_terms,
      marketing
    )
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const [result] = await connection.execute(sql,
      [
        parameter.type,
        parameter.uuid,
        parameter.user_name,
        parameter.phone,
        parameter.nick_name,
        parameter.password,
        parameter.password_hash_key,
        parameter.user_level,
        parameter.user_status,
        parameter.referrer,
        parameter.insignia_level,
        parameter.terms,
        parameter.privacy,
        parameter.location_terms,
        parameter.marketing
      ]
    ) as any;
    
    // ResultSetHeader에서 insertId 추출
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    };
  }

  async insertUserInsignia(connection : PoolConnection, parameter : any) {

    const sql = `
    INSERT INTO user_insignia(user_id, insignia_id, have_flag)
    VALUES(?,?,?)
    ON DUPLICATE KEY UPDATE have_flag = VALUES(have_flag)`;
    
    await connection.execute(sql, [parameter.user_id, 1, 1]);
    await connection.execute(sql, [parameter.user_id, 2, 1]);
    
    return true;
  }

  // 트랜잭션으로 유저 포인트 업데이트(Transaction, History)
  async insertSignUp(signupDto : SignUpDto, parameter : any) {
    return await this.db.transaction(async (connection) => {

      // 트랜잭션 묶일 Insert Query
      // 추천인 있을 시 추천인 에게 500 포인트 지급
      // 추천인 있을 시 본인에게도 500 포인트 지급
      // 회원가입
      // 기본 휘장 추가

      // 회원가입 파라미터
      let signupParam = {
        type : parameter.type,
        uuid : signupDto.uuid,
        user_name : signupDto.user_name,
        phone : signupDto.phone,
        nick_name : signupDto.nick_name,
        password : parameter.password,
        password_hash_key : parameter.password_hash_key,
        user_level : parameter.user_level,
        user_status : parameter.user_status,
        referrer : parameter.referrer_id,
        insignia_level : parameter.insignia_level,
        terms : signupDto.terms,
        privacy : signupDto.privacy,
        location_terms : signupDto.location_terms || 'N',  // undefined면 'N'으로 기본값 설정
        marketing : signupDto.marketing || 'N',           // undefined면 'N'으로 기본값 설정
        point_type : '' as string | null,
        point : 500,
        user_id : null as number | null
      };

      const signup = await this.insertUserData(connection, signupParam);
      // 새로 생성된 사용자 ID를 파라미터에 설정
      signupParam.user_id = signup.insertId;
      
      if(signupParam.referrer != null) {

        signupParam.point_type = 'referrer';
        await this.insertPointTransactionReferrer(connection, signupParam);
        await this.insertPointHistoryReferrer(connection, signupParam);

        signupParam.point_type = 'referrer_signup';
        await this.insertPointTransactionUser(connection, signupParam);
        await this.insertPointHistoryUser(connection, signupParam);
      }

      await this.insertUserInsignia(connection, signupParam);

    });
  }

  async getRefreshToken(refreshToken : String) {
    const sql = `
    SELECT user_id
    FROM user_session
    WHERE refresh_session = ?`;
    const [result] = await this.db.query(sql, [refreshToken]);
    return result;
  }

  async updateUserTokenSet(accessToken : String, refreshToken : String, user_id : Number) {
    const sql = `
    UPDATE user_session
    SET session = ?, refresh_session = ?
    WHERE user_id = ?`;
    const result = await this.db.query(sql, [accessToken, refreshToken, user_id]);
    return result;
  }

  async getUserUuid(phone : String) {
    const sql = `
    SELECT uuid, created_at
    FROM user
    WHERE phone = ?
    AND is_deleted = 0
    LIMIT 1`;
    const [result] = await this.db.query(sql, [phone]);
    return result;
  }

  async updateUserPassword(password : String, password_salt : String, uuid : String) {
    const sql = `
    UPDATE user
    SET password = ?, password_hash_key = ?
    WHERE uuid = ?`;
    await this.db.query(sql, [password, password_salt, uuid]);
  }
  
}
