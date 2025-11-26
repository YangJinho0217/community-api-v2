// src/modules/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PoolConnection } from 'mysql2/promise';
import { GetSearchDto } from './dto/getSearch.dto';

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

  async findForbiddenSearch(search : String) {
    const sql = `
    SELECT search
    FROM search_forbidden
    WHERE search = ?`;
    const result = await this.db.query(sql, [search]);
    return result;
  }

  async createUserSearch(connection : PoolConnection, user_id : Number, search : String) {
    const sql = `
    INSERT INTO user_search(user_id, search)
    VALUES(?,?)`;
    await connection.execute(sql, [user_id, search]);
  }

  async createSearchCount(connection : PoolConnection, search : String) {
    const sql = `
    INSERT INTO search(search, count)
    VALUES(?,?)
    ON DUPLICATE KEY UPDATE count = count + 1`;
    await connection.execute(sql, [search, 1]);
  }

  async createSearchTransaction(user_id : Number, search : String) {
    return await this.db.transaction(async (connection) => {

      if(user_id) {
        await this.createUserSearch(connection, user_id, search);
      }

      await this.createSearchCount(connection, search);
    });
  }

  async findSportsDailyMatch(search : String, user_id : Number) {
    const sql = `
    SELECT STR_TO_DATE(CAST(A.matchtime AS CHAR), '%Y%m%d%H%i') AS timeinfo,
           A.id AS match_id,
           A.match_id AS sports_match_id,
           A.category,
           B.name AS competition_name,
           B.kor_name AS kor_competition_name,
           B.logo AS competition_logo,
           A.home_team_id,
           C.name AS home_team_name,
           C.kor_name AS kor_home_team_name,
           C.logo AS home_team_logo,
           A.away_team_id,
           D.name AS away_team_name,
           D.kor_name AS kor_away_team_name,
           D.logo AS away_team_logo,
           A.home_score,
           A.away_score,
           A.match_status,
           E.status_description,
           CASE WHEN AP.match_id IS NOT NULL THEN 1
               ELSE 0
           END AS is_bookmark
    FROM ts_daily_match A
    JOIN ts_competition B ON A.competition_id = B.competition_id
    JOIN ts_team C ON A.home_team_id = C.team_id
    JOIN ts_team D ON A.away_team_id = D.team_id
    JOIN ts_match_status E ON A.match_status = E.status_code AND A.category = E.category
    LEFT JOIN user_bookmark AP ON A.id = AP.match_id AND AP.user_id = ?
    WHERE (B.name LIKE ? OR B.kor_name LIKE ? OR C.name LIKE ? OR C.kor_name LIKE ? OR D.name LIKE ? OR D.kor_name LIKE ?)
    AND A.is_deleted = 0
    ORDER BY
    CASE WHEN is_bookmark = 1 THEN 0 ELSE 1 END,
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
    LIMIT 5`;
    const result = await this.db.query(sql, [user_id, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`]);
    return result;
  }

  async findCommunityPost(search : String, user_id : Number) {
    // 메인 포스트 조회
    const selected_post = await this.db.query(`
      SELECT A.id
           , B.id AS user_id
           , B.nick_name
           , B.img
           , I.img AS insignia_img
           , A.title
           , A.content
           , A.created_at
           , A.updated_at
           , A.edited_at
           , A.allowable_range
           , A.views_count
           , A.is_blind
      FROM post A
      JOIN user B ON A.user_id = B.id
      LEFT JOIN insignia I ON B.insignia_level = I.insignia_level
      LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = A.user_id
      LEFT JOIN user_block UB2 ON UB2.user_id = A.user_id AND UB2.block_user_id = ?
      WHERE A.is_deleted = 0
      AND A.type = 'post'
      AND A.match_id IS NULL
      AND B.is_deleted = 0
      AND A.is_blind = 0
      AND UB1.block_user_id IS NULL
      AND UB2.block_user_id IS NULL
      AND (
          A.title LIKE ? 
          OR A.content LIKE ? 
          OR EXISTS (
              SELECT 1 FROM post_hashtag PH 
              JOIN hashtag H ON PH.hashtag_id = H.id 
              WHERE PH.post_id = A.id 
              AND H.is_deleted = 0 
              AND H.tag LIKE ?
          )
      )
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
      ORDER BY A.id DESC
      LIMIT 5
    `, [user_id, user_id, `%${search}%`, `%${search}%`, `%${search}%`, user_id, user_id]);

    if (selected_post.length === 0) {
      return [];
    }

    const post_ids = selected_post.map(p => p.id);
    const placeholders = post_ids.map(() => '?').join(',');

    // 좋아요 수 조회
    const selected_post_like = await this.db.query(`
      SELECT L.post_id, COUNT(*) AS like_count
      FROM post_like L
      LEFT JOIN user_block UB ON UB.user_id = ? AND UB.block_user_id = L.user_id
      LEFT JOIN user_block UB2 ON UB2.user_id = L.user_id AND UB2.block_user_id = ?
      JOIN user U ON U.id = L.user_id AND U.is_deleted = 0
      WHERE L.is_liked = 1
      AND UB.block_user_id IS NULL
      AND UB2.block_user_id IS NULL
      AND L.post_id IN (${placeholders})
      GROUP BY L.post_id
    `, [user_id, user_id, ...post_ids]);

    // 댓글 수 조회
    const selected_comment_count = await this.db.query(`
      SELECT C.post_id, COUNT(*) AS comment_count
      FROM post_comment C
      LEFT JOIN user_block UB ON UB.user_id = ? AND UB.block_user_id = C.user_id
      LEFT JOIN user_block UB2 ON UB2.user_id = C.user_id AND UB2.block_user_id = ?
      JOIN user U ON U.id = C.user_id AND U.is_deleted = 0
      WHERE C.is_deleted = 0
      AND C.parent_comment_id IS NULL
      AND (C.user_id = ? OR (C.user_id != ? AND C.is_blind = 0))
      AND UB.block_user_id IS NULL
      AND UB2.block_user_id IS NULL
      AND C.post_id IN (${placeholders})
      GROUP BY C.post_id
    `, [user_id, user_id, user_id, user_id, ...post_ids]);

    // 해시태그 조회 (모든 해시태그 가져오기)
    const selected_hashtag = await this.db.query(`
      SELECT PH.post_id, GROUP_CONCAT(DISTINCT H.tag SEPARATOR ',') AS hash_tag
      FROM post_hashtag PH
      JOIN hashtag H ON PH.hashtag_id = H.id
      WHERE H.is_deleted = 0
      AND PH.post_id IN (${placeholders})
      GROUP BY PH.post_id
    `, [...post_ids]);

    // 사용자 좋아요 여부 조회
    const selected_likes = await this.db.query(`
      SELECT post_id, is_liked
      FROM post_like
      WHERE user_id = ?
      AND post_id IN (${placeholders})
    `, [user_id, ...post_ids]);

    // 포스트 이미지 조회
    const post_img = await this.db.query(`
      SELECT A.id
           , A.post_id
           , A.img
      FROM post_img A
      WHERE A.post_id IN (${placeholders})
      AND A.is_deleted = 0
      ORDER BY A.post_id ASC
    `, [...post_ids]);

    // Map 구조로 변환 (post_id 기준)
    const likeCountMap = new Map(selected_post_like.map(({post_id, like_count}) => [post_id, like_count]));
    const commentCountMap = new Map(selected_comment_count.map(({post_id, comment_count}) => [post_id, comment_count]));
    const hashTagMap = new Map(selected_hashtag.map(({post_id, hash_tag}) => [post_id, hash_tag]));
    const likeFlagMap = new Map(selected_likes.map(({post_id, is_liked}) => [post_id, is_liked]));
    const postImgMap = post_img.reduce((acc, item) => {
      if (!acc[item.post_id]) acc[item.post_id] = [];
      acc[item.post_id].push({ id: item.id, url: item.img });
      return acc;
    }, {});

    // 조합
    const combined = selected_post.map(post => ({
      ...post,
      like_count: likeCountMap.get(post.id) || 0,
      comment_count: commentCountMap.get(post.id) || 0,
      hash_tag: hashTagMap.get(post.id) ? hashTagMap.get(post.id).split(',') : [],
      like_flag: likeFlagMap.get(post.id) || 0,
      files: postImgMap[post.id] || []
    }));

    return combined;
  }

  async findAnalyzePost(search : String, user_id : Number) {
    // 메인 분석 포스트 조회
    const selected_post = await this.db.query(`
      SELECT A.id
           , B.id AS user_id
           , B.nick_name
           , B.img
           , I.img AS insignia_img
           , A.title
           , A.content
           , A.created_at
           , A.updated_at
           , A.edited_at
           , A.allowable_range
           , A.views_count
           , A.is_blind
           , TD.category
      FROM post A
      JOIN user B ON A.user_id = B.id
      LEFT JOIN insignia I ON B.insignia_level = I.insignia_level
      LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = A.user_id
      LEFT JOIN user_block UB2 ON UB2.user_id = A.user_id AND UB2.block_user_id = ?
      JOIN ts_daily_match TD ON A.match_id = TD.id
      WHERE A.is_deleted = 0
      AND A.type = 'analyze'
      AND A.match_id IS NOT NULL
      AND B.is_deleted = 0
      AND A.is_blind = 0
      AND UB1.block_user_id IS NULL
      AND UB2.block_user_id IS NULL
      AND (
          A.title LIKE ? 
          OR A.content LIKE ? 
          OR EXISTS (
              SELECT 1 FROM post_hashtag PH 
              JOIN hashtag H ON PH.hashtag_id = H.id 
              WHERE PH.post_id = A.id 
              AND H.is_deleted = 0 
              AND H.tag LIKE ?
          )
      )
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
      ORDER BY A.id DESC
      LIMIT 5
    `, [user_id, user_id, `%${search}%`, `%${search}%`, `%${search}%`, user_id, user_id]);

    if (selected_post.length === 0) {
      return [];
    }

    const post_ids = selected_post.map(p => p.id);
    const placeholders = post_ids.map(() => '?').join(',');

    // 스포츠 매치 정보 조회
    const selected_sports = await this.db.query(`
      SELECT A.id AS post_id
           , B.match_id AS sports_match_id
           , B.competition_id
           , C.name AS competition_name
           , C.kor_name AS kor_competition_name
           , C.logo AS competition_logo
           , STR_TO_DATE(CAST(B.matchtime AS CHAR), '%Y%m%d%H%i') AS timeinfo
           , D.name AS home_team_name
           , D.kor_name AS kor_home_team_name
           , D.logo AS home_team_logo
           , E.name AS away_team_name
           , E.kor_name AS kor_away_team_name
           , E.logo AS away_team_logo
           , B.home_score
           , B.away_score
           , B.match_status
           , F.status_description
           , CASE WHEN AP.match_id IS NOT NULL THEN 1
                  ELSE 0
             END AS is_bookmark
      FROM post A
      JOIN ts_daily_match B ON A.match_id = B.id
      JOIN ts_competition C ON B.competition_id = C.competition_id
      JOIN ts_team D ON B.home_team_id = D.team_id
      JOIN ts_team E ON B.away_team_id = E.team_id
      JOIN ts_match_status F ON B.match_status = F.status_code AND B.category = F.category
      LEFT JOIN user_bookmark AP ON A.id = AP.match_id AND AP.user_id = ?
      WHERE A.id IN (${placeholders})
    `, [user_id, ...post_ids]);

    // 좋아요 수 조회
    const selected_post_like = await this.db.query(`
      SELECT L.post_id, COUNT(*) AS like_count
      FROM post_like L
      LEFT JOIN user_block UB ON UB.user_id = ? AND UB.block_user_id = L.user_id
      LEFT JOIN user_block UB2 ON UB2.user_id = L.user_id AND UB2.block_user_id = ?
      JOIN user U ON U.id = L.user_id AND U.is_deleted = 0
      WHERE L.is_liked = 1
      AND UB.block_user_id IS NULL
      AND UB2.block_user_id IS NULL
      AND L.post_id IN (${placeholders})
      GROUP BY L.post_id
    `, [user_id, user_id, ...post_ids]);

    // 댓글 수 조회
    const selected_comment_count = await this.db.query(`
      SELECT C.post_id, COUNT(*) AS comment_count
      FROM post_comment C
      LEFT JOIN user_block UB ON UB.user_id = ? AND UB.block_user_id = C.user_id
      LEFT JOIN user_block UB2 ON UB2.user_id = C.user_id AND UB2.block_user_id = ?
      JOIN user U ON U.id = C.user_id AND U.is_deleted = 0
      WHERE C.is_deleted = 0
      AND C.parent_comment_id IS NULL
      AND (C.user_id = ? OR (C.user_id != ? AND C.is_blind = 0))
      AND UB.block_user_id IS NULL
      AND UB2.block_user_id IS NULL
      AND C.post_id IN (${placeholders})
      GROUP BY C.post_id
    `, [user_id, user_id, user_id, user_id, ...post_ids]);

    // 해시태그 조회 (모든 해시태그 가져오기)
    const selected_hashtag = await this.db.query(`
      SELECT PH.post_id, GROUP_CONCAT(DISTINCT H.tag SEPARATOR ',') AS hash_tag
      FROM post_hashtag PH
      JOIN hashtag H ON PH.hashtag_id = H.id
      WHERE H.is_deleted = 0
      AND PH.post_id IN (${placeholders})
      GROUP BY PH.post_id
    `, [...post_ids]);

    // 사용자 좋아요 여부 조회
    const selected_likes = await this.db.query(`
      SELECT post_id, is_liked
      FROM post_like
      WHERE user_id = ?
      AND post_id IN (${placeholders})
    `, [user_id, ...post_ids]);

    // 포스트 이미지 조회
    const post_img = await this.db.query(`
      SELECT A.id
           , A.post_id
           , A.img
      FROM post_img A
      WHERE A.post_id IN (${placeholders})
      AND A.is_deleted = 0
      ORDER BY A.post_id ASC
    `, [...post_ids]);

    // Map 구조로 변환 (post_id 기준)
    const likeCountMap = new Map(selected_post_like.map(({post_id, like_count}) => [post_id, like_count]));
    const commentCountMap = new Map(selected_comment_count.map(({post_id, comment_count}) => [post_id, comment_count]));
    const hashTagMap = new Map(selected_hashtag.map(({post_id, hash_tag}) => [post_id, hash_tag]));
    const likeFlagMap = new Map(selected_likes.map(({post_id, is_liked}) => [post_id, is_liked]));
    const postImgMap = post_img.reduce((acc, item) => {
      if (!acc[item.post_id]) acc[item.post_id] = [];
      acc[item.post_id].push({ id: item.id, url: item.img });
      return acc;
    }, {});

    // 스포츠 Map 생성
    const sportsMap = new Map(selected_sports.map(s => [s.post_id, {
      sports_match_id: s.sports_match_id,
      competition_id: s.competition_id,
      competition_name: s.competition_name,
      kor_competition_name: s.kor_competition_name,
      competition_logo: s.competition_logo,
      timeinfo: s.timeinfo,
      home_team_name: s.home_team_name,
      kor_home_team_name: s.kor_home_team_name,
      home_team_logo: s.home_team_logo,
      away_team_name: s.away_team_name,
      kor_away_team_name: s.kor_away_team_name,
      away_team_logo: s.away_team_logo,
      home_score: s.home_score,
      away_score: s.away_score,
      match_status: s.match_status,
      status_description: s.status_description,
      is_bookmark: s.is_bookmark
    }]));

    // 조합
    const combined = selected_post.map(post => ({
      ...post,
      like_count: likeCountMap.get(post.id) || 0,
      comment_count: commentCountMap.get(post.id) || 0,
      hash_tag: hashTagMap.get(post.id) ? hashTagMap.get(post.id).split(',') : [],
      like_flag: likeFlagMap.get(post.id) || 0,
      files: postImgMap[post.id] || [],
      sports: sportsMap.get(post.id) || null
    }));

    return combined;
  }

  async findNews(search : String) {
    const sql = `
    SELECT title,
           pub_date,
           thumnail
    FROM news
    WHERE (title LIKE ? OR description LIKE ?)
    ORDER BY pub_date DESC
    LIMIT 4`;
    const result = await this.db.query(sql, [`%${search}%`, `%${search}%`]);
    return result;
  }

  async findUser(search : String, user_id : Number) {
    // 메인 사용자 조회
    const user_selected = await this.db.query(`
      SELECT A.id AS user_id
           , A.img
           , I.img AS insignia_img
           , A.nick_name
      FROM user A
      LEFT JOIN insignia I ON A.insignia_level = I.insignia_level
      WHERE A.nick_name LIKE ?
      AND A.is_deleted = 0
      AND NOT EXISTS (
          SELECT 1 
          FROM user_block UB
          WHERE UB.user_id = ? -- 로그인한 유저
          AND UB.block_user_id = A.id
      )
      AND NOT EXISTS (
          SELECT 1
          FROM user_block UB2
          WHERE UB2.user_id = A.id 
          AND UB2.block_user_id = ?    
      )
      LIMIT 5
    `, [`%${search}%`, user_id, user_id]);

    if (user_selected.length === 0) {
      return [];
    }

    const user_ids = user_selected.map(p => p.user_id);
    const placeholders = user_ids.map(() => '?').join(',');

    // 팔로우 상태 조회
    const user_follow_selected = await this.db.query(`
      SELECT user_id
           , following_id
           , CASE WHEN is_followed = 0 THEN false
                  WHEN is_followed = 1 THEN true
                  ELSE false
             END AS is_followed
      FROM follow
      WHERE user_id = ?
      AND following_id IN (${placeholders})
    `, [user_id, ...user_ids]);
    
    // 팔로우 맵 생성
    const followMap = new Map(user_follow_selected.map(f => [f.following_id, f.is_followed]));

    // 결과 조합
    const result = user_selected.map(user => ({
      ...user,
      follows: followMap.get(user.user_id) == 1 ? 1 : 0
    }));

    return result;
  }
}
