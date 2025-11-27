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
               TDC.name AS competition_name,
               TDC.kor_name AS kor_competition_name,
               TDC.logo AS competition_logo,
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
               UI.img AS insignia_img,
               TD.category,
               CASE WHEN B.user_level = '01' THEN '일반'
                   WHEN B.user_level = '02' THEN '아마추어'
                   WHEN B.user_level = '03' THEN '프로'
                   WHEN B.user_level = '04' THEN '레전드'
                   ELSE null END AS user_level_name,
               AP.winner_id,
               CASE 
                   WHEN AP.winner_id = TD.home_team_id THEN TDH.name
                   WHEN AP.winner_id = TD.away_team_id THEN TDA.name
                   ELSE 'draw'
               END AS winner_name,
               CASE 
                   WHEN AP.winner_id = TD.home_team_id THEN TDH.kor_name
                   WHEN AP.winner_id = TD.away_team_id THEN TDA.kor_name
                   ELSE 'draw'
               END AS kor_winner_name
        FROM post A
        JOIN user B ON A.user_id = B.id
        JOIN insignia UI ON B.insignia_level = UI.insignia_level
        JOIN ts_daily_match TD ON A.match_id = TD.id
        JOIN ts_competition TDC ON TD.competition_id = TDC.competition_id
        JOIN ts_team TDH ON TD.home_team_id = TDH.team_id
        JOIN ts_team TDA ON TD.away_team_id = TDA.team_id
        JOIN ts_match_status TMS ON TD.match_status = TMS.status_code AND TD.category = TMS.category
        LEFT JOIN analyze_pick AP ON AP.post_id = A.id
        LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = A.user_id
        LEFT JOIN user_block UB2 ON UB2.user_id = A.user_id AND UB2.block_user_id = ?
        WHERE A.is_deleted = 0
        AND A.is_blind = 0
        AND A.type = 'analyze'
        AND A.match_id IS NOT NULL
        AND B.is_deleted = 0
        AND UB1.block_user_id IS NULL
        AND UB2.block_user_id IS NULL
        AND TD.matchtime BETWEEN ? AND ?
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
                B.primary_color,
                B.secondary_color,
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

  async findNews(params : {
    categoryCondition: string;
    categoryParams: any[];
    newslimit : number | null;}) {
        
        const { categoryCondition, categoryParams, newslimit } = params;
        const sql = `
        SELECT thumnail,
               title,
               description,
               originallink,
               link,
               pub_date,
               category
        FROM news
        WHERE originallink IS NOT NULL
        ${categoryCondition}
        ORDER BY pub_date DESC
        LIMIT ${newslimit || 1}`;

        const queryParams = [
            ...categoryParams
        ]

        return this.db.query(sql, queryParams);
  }

  async findPostTopTen(params : {
    postlimit : number | 0}) {
        const { postlimit } = params;
        const sql = `
        SELECT A.id,
               A.type,
               A.title,
               A.content,
               A.views_count,
               COUNT(DISTINCT C.id) AS post_comment_count,
               COUNT(DISTINCT L.id) AS post_like,
               PI.img,
               (
                (
                    A.views_count * 1 +
                    COUNT(DISTINCT C.id) * 5 +
                    COUNT(DISTINCT L.id) * 10
                ) / POWER(TIMESTAMPDIFF(HOUR, A.created_at, NOW()) + 2, 1.5)
            ) AS score
        FROM post A
        LEFT JOIN post_comment C 
            ON C.post_id = A.id 
            AND C.parent_comment_id IS NULL 
            AND C.is_deleted = 0 
            AND C.is_blind = 0
        LEFT JOIN post_like L 
            ON L.post_id = A.id 
            AND L.is_liked = 1
        LEFT JOIN (
            SELECT post_id, img
            FROM post_img
            ORDER BY created_at ASC
        ) PI ON PI.post_id = A.id
        WHERE A.is_deleted = 0 
        AND A.is_blind = 0
        GROUP BY A.id, A.title, A.content, A.views_count, PI.img
        ORDER BY score DESC
        LIMIT ${postlimit || 1}`;
        const result = await this.db.query(sql, []);
        return result;
  }

  async findInjury(params : { 
    user_id : number | 0;
    categoryCondition: string;
    categoryParams: any[];
    injurylimit : number | 0;}) {
        const { user_id, categoryCondition, categoryParams, injurylimit } = params;
        const sql = `
        SELECT A.id,
               A.type,
               A.title,
               B.nick_name,
               A.created_at,
               A.edited_at,
               A.views_count
        FROM post A
        JOIN user B ON A.user_id = B.id
        LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = A.user_id
        LEFT JOIN user_block UB2 ON UB2.user_id = A.user_id AND UB2.block_user_id = ?
        WHERE A.type = 'injury'
          AND A.is_deleted  = 0
          AND A.is_blind    = 0
          AND B.is_deleted  = 0
          AND B.user_status = 0
          AND UB1.block_user_id IS NULL
          AND UB2.block_user_id IS NULL
        ${categoryCondition}
        ORDER BY A.edited_at DESC
        LIMIT ${injurylimit || 1}`;
        const result = await this.db.query(sql, [user_id, user_id, ...categoryParams]);
        return result;
  }

  async findLineup(params : { 
    user_id : number | 0;
    categoryCondition: string;
    categoryParams: any[];
    injurylimit : number | 0;}) {
        const { user_id, categoryCondition, categoryParams, injurylimit } = params;
        const sql = `
        SELECT A.id,
               A.type,
               A.title,
               B.nick_name,
               A.created_at,
               A.edited_at,
               A.views_count
        FROM post A
        JOIN user B ON A.user_id = B.id
        LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = A.user_id
        LEFT JOIN user_block UB2 ON UB2.user_id = A.user_id AND UB2.block_user_id = ?
        WHERE A.type = 'lineup'
          AND A.is_deleted  = 0
          AND A.is_blind    = 0
          AND B.is_deleted  = 0
          AND B.user_status = 0
          AND UB1.block_user_id IS NULL
          AND UB2.block_user_id IS NULL
        ${categoryCondition}
        ORDER BY A.edited_at DESC
        LIMIT ${injurylimit || 1}`;
        const result = await this.db.query(sql, [user_id, user_id, ...categoryParams]);
        return result;
  }
  
  // 1단계: 1:1 매칭된 경기 ID들 조회 (날짜별로 2개씩)
  async findValidMatchIds(params: {
    user_id: number | null;
    categoryCondition: string;
    categoryParams: any[];
  }) {
    const { user_id, categoryCondition, categoryParams } = params;

    const sql = `
      SELECT match_id, date_priority FROM (
        SELECT AP.match_id,
               CASE 
                 WHEN DATE(STR_TO_DATE(CAST(TD.matchtime AS CHAR), '%Y%m%d%H%i')) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN 1
                 WHEN DATE(STR_TO_DATE(CAST(TD.matchtime AS CHAR), '%Y%m%d%H%i')) = CURDATE() THEN 2
                 WHEN DATE(STR_TO_DATE(CAST(TD.matchtime AS CHAR), '%Y%m%d%H%i')) = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 3
               END AS date_priority,
               MAX(P.views_count) AS max_views,
               ROW_NUMBER() OVER (
                 PARTITION BY 
                   CASE 
                     WHEN DATE(STR_TO_DATE(CAST(TD.matchtime AS CHAR), '%Y%m%d%H%i')) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN 1
                     WHEN DATE(STR_TO_DATE(CAST(TD.matchtime AS CHAR), '%Y%m%d%H%i')) = CURDATE() THEN 2
                     WHEN DATE(STR_TO_DATE(CAST(TD.matchtime AS CHAR), '%Y%m%d%H%i')) = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 3
                   END 
                 ORDER BY MAX(P.views_count) DESC
               ) AS match_rank
        FROM analyze_pick AP
        JOIN post P ON AP.post_id = P.id
        JOIN user U ON P.user_id = U.id
        JOIN ts_daily_match TD ON AP.match_id = TD.id
        LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = P.user_id
        LEFT JOIN user_block UB2 ON UB2.user_id = P.user_id AND UB2.block_user_id = ?
        WHERE P.is_deleted = 0
        ${categoryCondition}
        AND P.type = 'analyze'
        AND U.is_deleted = 0
        AND U.user_status = 0
        AND UB1.block_user_id IS NULL
        AND UB2.block_user_id IS NULL
        AND DATE(STR_TO_DATE(CAST(TD.matchtime AS CHAR), '%Y%m%d%H%i')) IN (
          DATE_SUB(CURDATE(), INTERVAL 1 DAY),
          CURDATE(),
          DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        )
        AND (
            P.user_id = ?
            OR P.allowable_range = 'public'
            OR (
                P.allowable_range = 'follower'
                AND EXISTS (
                    SELECT 1 FROM follow F
                    WHERE F.user_id = ? AND F.following_id = P.user_id AND F.is_followed = 1
                )
            )
        )
        GROUP BY AP.match_id
        HAVING COUNT(DISTINCT P.user_id) = 2
      ) ranked_matches
      WHERE match_rank <= 2
      ORDER BY date_priority
    `;

    const queryParams = [
      user_id ?? null,
      user_id ?? null,
      ...categoryParams,
      user_id ?? null,
      user_id ?? null
    ];

    return this.db.query(sql, queryParams);
  }

  // 2단계: 특정 경기들의 분석글 조회
  async findAnalyzePostsByMatchIds(matchIds: number[], user_id: number | null) {
    if (matchIds.length === 0) return [];

    const placeholders = matchIds.map(() => '?').join(',');
    
    const sql = `
      SELECT A.id AS post_id,
             A.match_id,
             A.views_count,
             B.nick_name,
             B.img,
             B.type,
             C.level_name,
             A.title,
             A.content,
             CASE 
                 WHEN AP.winner_id = TD.home_team_id THEN TDH.logo
                 WHEN AP.winner_id = TD.away_team_id THEN TDA.logo
                 ELSE null
             END AS winner_logo,
             CASE 
                 WHEN AP.winner_id = TD.home_team_id THEN TDH.name
                 WHEN AP.winner_id = TD.away_team_id THEN TDA.name
                 ELSE 'draw'
             END AS winner_name,
             CASE 
                 WHEN AP.winner_id = TD.home_team_id THEN TDH.kor_name
                 WHEN AP.winner_id = TD.away_team_id THEN TDA.kor_name
                 ELSE 'draw'
             END AS kor_winner_name,
             A.created_at,
             CASE 
               WHEN DATE(STR_TO_DATE(CAST(TD.matchtime AS CHAR), '%Y%m%d%H%i')) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN 1
               WHEN DATE(STR_TO_DATE(CAST(TD.matchtime AS CHAR), '%Y%m%d%H%i')) = CURDATE() THEN 2
               WHEN DATE(STR_TO_DATE(CAST(TD.matchtime AS CHAR), '%Y%m%d%H%i')) = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 3
               ELSE 4
             END AS date_priority
      FROM post A
      JOIN user B ON A.user_id = B.id
      JOIN level C ON B.user_level = C.level_code
      JOIN analyze_pick AP ON AP.post_id = A.id
      JOIN ts_daily_match TD ON AP.match_id = TD.id
      JOIN ts_team TDH ON TD.home_team_id = TDH.team_id
      JOIN ts_team TDA ON TD.away_team_id = TDA.team_id
      LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = A.user_id
      LEFT JOIN user_block UB2 ON UB2.user_id = A.user_id AND UB2.block_user_id = ?
      WHERE A.is_deleted = 0
      AND A.type = 'analyze'
      AND B.is_deleted = 0
      AND B.user_status = 0
      AND UB1.block_user_id IS NULL
      AND UB2.block_user_id IS NULL
      AND A.match_id IN (${placeholders})
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
      ORDER BY date_priority, A.views_count DESC, A.created_at DESC
    `;

    const queryParams = [
      user_id ?? null,
      user_id ?? null,
      ...matchIds,
      user_id ?? null,
      user_id ?? null
    ];

    return this.db.query(sql, queryParams);
  }

  // 메인 함수: 위 두 함수를 조합
  async findAnalyzeMatch(params: {
    user_id: number | null;
    categoryCondition: string;
    categoryParams: any[];
  }) {
    // 1단계: 유효한 매치 ID들 조회
    const validMatches = await this.findValidMatchIds(params);
    
    if (validMatches.length === 0) {
      return [];
    }

    // 2단계: 해당 매치들의 분석글 조회
    const matchIds = validMatches.map(match => match.match_id);
    return await this.findAnalyzePostsByMatchIds(matchIds, params.user_id);
  }

  async findSportsInfoByMatchIds(matchIds: number[]) {
    if (matchIds.length === 0) return [];

    const placeholders = matchIds.map(() => '?').join(',');

    const sql = `
      SELECT TD.id AS match_id,
             TC.name AS competition_name,
             TC.kor_name AS kor_competition_name,
             TC.logo AS competition_logo,
             TDH.name AS home_team_name,
             TDH.kor_name AS kor_home_team_name,
             TDH.logo AS home_team_logo,
             TDA.name AS away_team_name,
             TDA.kor_name AS kor_away_team_name,
             TDA.logo AS away_team_logo,
             STR_TO_DATE(CAST(TD.matchtime AS CHAR), '%Y%m%d%H%i') AS timeinfo
      FROM ts_daily_match TD
      JOIN ts_competition TC ON TD.competition_id = TC.competition_id
      JOIN ts_team TDH ON TD.home_team_id = TDH.team_id
      JOIN ts_team TDA ON TD.away_team_id = TDA.team_id
      WHERE TD.id IN (${placeholders})
    `;

    return this.db.query(sql, matchIds);
  }

  async findPostImagesByPostIds(postIds: number[]) {
    if (postIds.length === 0) return [];

    const placeholders = postIds.map(() => '?').join(',');

    const sql = `
      SELECT id, 
             post_id, 
             img
      FROM post_img
      WHERE post_id IN (${placeholders})
      AND is_deleted = 0
      ORDER BY post_id ASC
    `;

    return this.db.query(sql, postIds);
  }
}
