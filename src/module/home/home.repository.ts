// src/modules/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PoolConnection } from 'mysql2/promise';

@Injectable()
export class HomeRepository {
  constructor(private readonly db: DatabaseService) {}

  // 모든 사용자 조회
  async findAll() {
    const sql = 'SELECT uuid FROM user';
    return this.db.query(sql);
  }

  async findPopUp() {
    const sql = `
    SELECT id,
           title,
           content
    FROM notice
    WHERE is_popup = 1
    AND is_deleted = 0
    ORDER BY created_at DESC, updated_at DESC
    LIMIT 1`;
    const [result] = await this.db.query(sql);
    return result;
  }

//   // 디버깅: 분석글 기

  // 전문가 분석 글 조회
  async findAnalyzePosts(params: {
    user_id: number | null;
    startTime: string;
    endTime: string;
    categoryCondition: string;
    categoryParams: any[];
    aplimit : number | null;
  }) {
    const { user_id, startTime, endTime, categoryCondition, categoryParams, aplimit } = params;
    
    const sql = `
      SELECT A.id,
             TDH.name AS home_team_name,
             TDH.kor_name AS kor_home_team_name,
             TDH.logo AS home_team_logo,
             TDA.name AS away_team_name,
             TDA.kor_name AS kor_away_team_name,
             TDA.logo AS away_team_logo,
             STR_TO_DATE(CAST(TD.matchtime AS CHAR), '%Y%m%d%H%i') AS timeinfo,
             TD.match_status,
             TMS.status_description,
             B.nick_name,
             B.img,
             TD.category,
             CASE WHEN B.user_level = '01' THEN '일반'
                  WHEN B.user_level = '02' THEN '아마추어'
                  WHEN B.user_level = '03' THEN '프로'
                  WHEN B.user_level = '04' THEN '레전드'
                  ELSE null END AS user_level_name
      FROM post A
      JOIN user B ON A.user_id = B.id
      JOIN ts_daily_match TD ON A.match_id = TD.id
      JOIN ts_competition TDC ON TD.competition_id = TDC.competition_id
      JOIN ts_team TDH ON TD.home_team_id = TDH.team_id
      JOIN ts_team TDA ON TD.away_team_id = TDA.team_id
      JOIN ts_match_status TMS ON TD.match_status = TMS.status_code AND TD.category = TMS.category
      LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = A.user_id
      LEFT JOIN user_block UB2 ON UB2.user_id = A.user_id AND UB2.block_user_id = ?
      WHERE A.is_deleted = 0
        AND B.type = 'basic'
        AND A.is_blind = 0
        AND A.type = 'analyze'
        AND A.match_id IS NOT NULL
        AND B.is_deleted = 0
        AND UB1.block_user_id IS NULL
        AND UB2.block_user_id IS NULL
        AND TD.matchtime BETWEEN ? AND ?
        -- 시간 조건 완화: 당일 경기는 모두 포함 (과거 경기도 분석글 표시)
        -- AND TD.matchtime >= CAST(DATE_FORMAT(UTC_TIMESTAMP(), '%Y%m%d%H%i') AS UNSIGNED)
        -- 경기 상태 조건 완화: 시작 전(1)과 진행중 상태도 포함
        AND TD.match_status IN (1, 2, 3, 4, 5, 6, 7, 8)
        ${categoryCondition}
        AND (
            A.user_id = ?
            OR A.allowable_range = 'public'
            OR (
                A.allowable_range = 'follower'
                AND EXISTS (
                    SELECT 1 FROM follow F
                    WHERE F.user_id = ? AND F.following_id = A.user_id AND F.is_followed = 1
                )
            )
        )
      ORDER BY 
        CASE 
            -- ⚽ 축구 진행중
            WHEN TD.category = 'soccer' AND TD.match_status IN (2,3,4,5,6,7) THEN 1
            -- 🏀 농구 진행중
            WHEN TD.category = 'basketball' AND TD.match_status IN (2,3,4,5,6,7,8,9) THEN 1
            -- 🏐 배구 진행중
            WHEN TD.category = 'volleyball' AND TD.match_status IN (432,434,436,438,440) THEN 1
            -- ⚾ 야구 진행중
            WHEN TD.category = 'baseball' AND TD.match_status BETWEEN 432 AND 421 THEN 1
            -- 🎮 LOL 진행중
            WHEN TD.category = 'lol' AND TD.match_status = 2 THEN 1
            -- 아직 시작 안한 경기
            WHEN TD.match_status = 1 THEN 2
            -- 종료 / 취소 / 지연 등
            WHEN TD.match_status IN (8,9,10,11,12,13,14,15,100) THEN 3
            ELSE 99
        END,
        -- 🔼 진행중 경기 안에서는 view_count 높은 순
        CASE 
            WHEN 
            (TD.category = 'soccer' AND TD.match_status IN (2,3,4,5,6,7))
            OR (TD.category = 'basketball' AND TD.match_status IN (2,3,4,5,6,7,8,9))
            OR (TD.category = 'volleyball' AND TD.match_status IN (432,434,436,438,440))
            OR (TD.category = 'baseball' AND TD.match_status BETWEEN 432 AND 421)
            OR (TD.category = 'lol' AND TD.match_status = 2)
            THEN TD.view_count 
            ELSE 0 
        END DESC,
        -- ⚽ 그 외 시간 순 정렬
        TD.matchtime ASC
      LIMIT ${aplimit || 1}`;

    const queryParams = [
      user_id ?? null,           // UB1.user_id
      user_id ?? null,           // UB2.block_user_id  
      startTime,                 // TD.matchtime BETWEEN ? 
      endTime,                   // AND ?
      ...categoryParams,         // 카테고리 (있는 경우만)
      user_id ?? null,           // A.user_id = ? (권한 체크)
      user_id ?? null            // F.user_id = ? (팔로워 체크)
    ];

    return this.db.query(sql, queryParams);
  }

  async findLiveScore(params: {
        user_id: number | null;
        startTime: string;
        endTime: string;
        categoryCondition: string;
        categoryParams: any[];
        lslimit : number | null;
    }) {
    const { user_id, startTime, endTime, categoryCondition, categoryParams, lslimit } = params;
    const sql = `
    SELECT STR_TO_DATE(CAST(A.matchtime AS CHAR), '%Y%m%d%H%i') AS timeinfo,
           A.match_id AS sports_match_id,
           A.category,
           A.competition_id,
           B.name AS competition_name,
           B.kor_name AS kor_competition_name,
           B.logo AS competition_logo,
           C.logo AS home_team_logo,
           C.name AS home_team_name,
           C.kor_name AS kor_home_team_name,
           D.logo AS away_team_logo,
           D.name AS away_team_name,
           D.kor_name AS kor_away_team_name,
           A.match_status,
           E.status_description,
           A.home_score,
           A.away_score,
           A.environment,
           CASE WHEN AP.match_id IS NOT NULL THEN 1
                ELSE 0
           END AS is_bookmark
    FROM ts_daily_match A
    JOIN ts_competition B ON A.competition_id = B.competition_id
    JOIN ts_team C ON A.home_team_id = C.team_id
    JOIN ts_team D ON A.away_team_id = D.team_id
    JOIN ts_match_status E ON A.match_status = E.status_code AND A.category = E.category
    LEFT JOIN user_bookmark AP ON A.id = AP.match_id AND AP.user_id = ?
    WHERE A.matchtime >= ?
    AND A.matchtime <= ?
    AND A.is_deleted = 0
    ${categoryCondition}
    ORDER BY 
        CASE 
            -- ⚽ 축구 진행중
            WHEN A.category = 'soccer' AND A.match_status IN (2,3,4,5,6,7) THEN 1
            -- 🏀 농구 진행중
            WHEN A.category = 'basketball' AND A.match_status IN (2,3,4,5,6,7,8,9) THEN 1
            -- 🏐 배구 진행중
            WHEN A.category = 'volleyball' AND A.match_status IN (432,434,436,438,440) THEN 1
            -- ⚾ 야구 진행중
            WHEN A.category = 'baseball' AND A.match_status BETWEEN 432 AND 421 THEN 1
            -- 🎮 LOL 진행중
            WHEN A.category = 'lol' AND A.match_status = 2 THEN 1
            -- 아직 시작 안한 경기
            WHEN A.match_status = 1 THEN 2
            -- 종료 / 취소 / 지연 등
            WHEN A.match_status IN (8,9,10,11,12,13,14,15,100) THEN 3
            ELSE 99
        END,
        -- 🔼 진행중 경기 안에서는 view_count 높은 순
        CASE 
            WHEN 
            (A.category = 'soccer' AND A.match_status IN (2,3,4,5,6,7))
            OR (A.category = 'basketball' AND A.match_status IN (2,3,4,5,6,7,8,9))
            OR (A.category = 'volleyball' AND A.match_status IN (432,434,436,438,440))
            OR (A.category = 'baseball' AND A.match_status BETWEEN 432 AND 421)
            OR (A.category = 'lol' AND A.match_status = 2)
            THEN A.view_count 
            ELSE 0 
        END DESC,
        -- ⚽ 그 외 시간 순 정렬
        A.matchtime ASC
    LIMIT ${lslimit || 1}`
    const queryParams = [        // UB1.user_id
      user_id ?? null,           // UB2.block_user_id  
      startTime,                 // TD.matchtime BETWEEN ? 
      endTime,                   // AND ?
      ...categoryParams,         // 카테고리 (있는 경우만)
      // user_id ?? null,           // A.user_id = ? (권한 체크)
      // user_id ?? null            // F.user_id = ? (팔로워 체크)
    ];

    return this.db.query(sql, queryParams);
  }
  
}
