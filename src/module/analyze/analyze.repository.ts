// src/modules/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PoolConnection } from 'mysql2/promise';

@Injectable()
export class AnalyzeRepository {
  constructor(private readonly db: DatabaseService) {}

  // 모든 사용자 조회
  async findAll() {
    const sql = 'SELECT uuid FROM user';
    return this.db.query(sql);
  }

  async findAnalyzePostTotal(
    categoryCondition : string, 
    categoryParams: any[],
    filterCondition: string,
    filterParams: any[],
    user_id : number) {

    let block_user = '';
    if(user_id) {
      block_user = 'AND UB1.block_user_id IS NULL AND UB2.block_user_id IS NULL'
    }
    const sql = `
    SELECT COUNT(A.id) AS count
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
    ${block_user}
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
    ${categoryCondition}
    ${filterCondition}`;
    const result = await this.db.query(sql, [
      user_id, user_id, user_id, user_id, ...categoryParams, ...filterParams
    ]);
    return result;
  }

  async findAnalyzePost(
    categoryCondition : string, 
    categoryParams: any[],
    filterCondition: string,
    filterParams: any[],
    user_id : number, 
    page_no : number, 
    limit : number) {

    let block_user = '';
    if(user_id) {
      block_user = 'AND UB1.block_user_id IS NULL AND UB2.block_user_id IS NULL'
    }

    const offset = (page_no - 1) * limit;
    const sql = `
    SELECT A.id
         , B.nick_name
         , B.img
         , I.img AS insignia_img
         , BD.img AS badge_img
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
    LEFT JOIN badge BD ON B.badge_id = BD.id
    LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = A.user_id
    LEFT JOIN user_block UB2 ON UB2.user_id = A.user_id AND UB2.block_user_id = ?
    JOIN ts_daily_match TD ON A.match_id = TD.id
    WHERE A.is_deleted = 0
    AND A.type = 'analyze'
    AND A.match_id IS NOT NULL
    AND B.is_deleted = 0
    AND A.is_blind = 0
    ${block_user}
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
    ${categoryCondition}
    ${filterCondition}
    ORDER BY A.id DESC
    LIMIT ${limit} OFFSET ${offset}`;
    const post = await this.db.query(sql, [
      user_id, user_id, user_id, user_id, ...categoryParams, ...filterParams
    ]);

    const post_ids = post.map(id => id.id);

    if(post_ids.length > 0) {
      const placeholders = post_ids.map(() => '?').join(','); // ?,?,?

      const plcount_sql = `
      SELECT L.post_id, COUNT(*) AS like_count
      FROM post_like L
      LEFT JOIN user_block UB ON UB.user_id = ? AND UB.block_user_id = L.user_id
      LEFT JOIN user_block UB2 ON UB2.user_id = L.user_id AND UB2.block_user_id = ?
      JOIN user U ON U.id = L.user_id AND U.is_deleted = 0
      WHERE L.is_liked = 1
      ${block_user}
      AND L.post_id IN (${placeholders})
      GROUP BY L.post_id`;
      const plcount = await this.db.query(plcount_sql, [user_id, user_id, ...post_ids]);

      const pcmcount_sql = `
      SELECT C.post_id, COUNT(*) AS comment_count
      FROM post_comment C
      LEFT JOIN user_block UB ON UB.user_id = ? AND UB.block_user_id = C.user_id
      LEFT JOIN user_block UB2 ON UB2.user_id = C.user_id AND UB2.block_user_id = ?
      JOIN user U ON U.id = C.user_id AND U.is_deleted = 0
      WHERE C.is_deleted = 0
      AND C.parent_comment_id IS NULL
      AND (C.user_id = ? OR (C.user_id != ? AND C.is_blind = 0))
      ${block_user}
      AND C.post_id IN (${placeholders})
      GROUP BY C.post_id`;
      const pcmcount = await this.db.query(pcmcount_sql, [user_id, user_id, user_id, user_id, ...post_ids]);

      const hashtag_sql = `
      SELECT PH.post_id, GROUP_CONCAT(DISTINCT H.tag SEPARATOR ',') AS hash_tag
      FROM post_hashtag PH
      JOIN hashtag H ON PH.hashtag_id = H.id
      WHERE H.is_deleted = 0
      AND PH.post_id IN (${placeholders})
      GROUP BY PH.post_id`;
      const hashtag = await this.db.query(hashtag_sql, [...post_ids]);

      const lkflag_sql = `
      SELECT post_id, is_liked
      FROM post_like
      WHERE user_id = ?
      AND post_id IN (${placeholders})`;
      const likeflag = await this.db.query(lkflag_sql, [user_id, ...post_ids]);

      const pimg_sql = `
      SELECT A.id
           , A.post_id
           , A.img
      FROM post_img A
      WHERE A.post_id IN (${placeholders})
      AND A.is_deleted = 0
      ORDER BY A.post_id ASC`;
      const pimg = await this.db.query(pimg_sql, [...post_ids]);

      const sports_sql = `
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
           , AC.winner_id
           , CASE WHEN AC.winner_id = D.team_id THEN D.name
                   WHEN AC.winner_id = E.team_id THEN E.name
                   ELSE NULL END AS winner_name
           , CASE WHEN AC.winner_id = D.team_id THEN D.kor_name
                   WHEN AC.winner_id = E.team_id THEN E.kor_name
                   ELSE NULL END AS winner_kor_name
           , CASE WHEN B.match_status = 1 THEN 'wait'
                  WHEN B.winner = 'home' AND AC.winner_id = D.team_id THEN 'hit'
                  WHEN B.winner = 'away' AND AC.winner_id = E.team_id THEN 'hit'
                  WHEN B.winner = 'draw' AND AC.winner_id = 'draw' THEN 'hit'
                  ELSE 'missed' END AS hit_flag
      FROM post A
      JOIN ts_daily_match B ON A.match_id = B.id
      JOIN ts_competition C ON B.competition_id = C.competition_id
      JOIN ts_team D ON B.home_team_id = D.team_id
      JOIN ts_team E ON B.away_team_id = E.team_id
      JOIN ts_match_status F ON B.match_status = F.status_code AND B.category = F.category
      LEFT JOIN analyze_pick AC ON A.id = AC.post_id
      WHERE A.id IN (${placeholders})`;
      const sports = await this.db.query(sports_sql, [...post_ids]);

      const likeCountMap = new Map(plcount.map(({post_id, like_count}) => [post_id, like_count]));
      const commentCountMap = new Map(pcmcount.map(({post_id, comment_count}) => [post_id, comment_count]));
      const hashTagMap = new Map(hashtag.map(({post_id, hash_tag}) => [post_id, hash_tag]));
      const likeFlagMap = new Map(likeflag.map(({post_id, is_liked}) => [post_id, is_liked]));
      const postImgMap = pimg.reduce((acc, item) => {
          if (!acc[item.post_id]) acc[item.post_id] = [];
          acc[item.post_id].push({ id: item.id, url: item.img });
          return acc;
      }, {});
      // 1. sports Map 제대로 만들기
      const sportsMap = new Map(sports.map(s => {
          return [s.post_id, {
              sports_match_id : s.sports_match_id,
              competition_id : s.competition_id,
              competition_name: s.competition_name,
              kor_competition_name : s.kor_competition_name,
              competition_logo: s.competition_logo,
              timeinfo: s.timeinfo,
              home_team_name: s.home_team_name,
              kor_home_team_name : s.kor_home_team_name,
              home_team_logo: s.home_team_logo,
              away_team_name: s.away_team_name,
              kor_away_team_name : s.kor_away_team_name,
              away_team_logo: s.away_team_logo,
              home_score: s.home_score,
              away_score: s.away_score,
              match_status: s.match_status,
              status_description: s.status_description,
              winner_id: s.winner_id,
              winner_name : s.winner_name,
              winner_kor_name : s.winner_kor_name,
              hit_flag : s.hit_flag
          }];
      }));

      const combine = post.map(post => ({
        ...post,
        like_count : likeCountMap.get(post.id) || 0,
        comment_count : commentCountMap.get(post.id) || 0,
        hash_tag: hashTagMap.get(post.id) ? hashTagMap.get(post.id).split(',') : [],
        like_flag: likeFlagMap.get(post.id) || 0,
        files: postImgMap[post.id] || [],
        sports : sportsMap.get(post.id) || null
      }))

      return combine;
    } else {
      return [];
    }
  }

  async findAnalyzePostDetail(post_id : number, user_id : number) {

    let block_user = '';
    if(user_id) {
      block_user = 'AND UB1.block_user_id IS NULL AND UB2.block_user_id IS NULL'
    }

    const sql = `
    SELECT A.id
         , A.user_id
         , B.nick_name
         , B.img
         , I.img AS insignia_img
         , BD.img AS badge_img
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
    JOIN ts_daily_match TD ON A.match_id = TD.id
    LEFT JOIN insignia I ON B.insignia_level = I.insignia_level
    LEFT JOIN badge BD ON B.badge_id = BD.id
    LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = A.user_id
    LEFT JOIN user_block UB2 ON UB2.user_id = A.user_id AND UB2.block_user_id = ?
    WHERE A.id = ?
    AND A.is_deleted = 0
    AND A.type = 'analyze'
    AND A.match_id IS NOT NULL
    AND B.is_deleted = 0
    AND A.is_blind = 0
    ${block_user}
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
    LIMIT 1`;

    const post = await this.db.query(sql, [user_id, user_id, post_id, user_id, user_id]);

    const post_ids = post.map(id => id.id);

    if(post_ids.length > 0) {
      const placeholders = post_ids.map(() => '?').join(','); // ?,?,?

      const plcount_sql = `
      SELECT L.post_id, COUNT(*) AS like_count
      FROM post_like L
      LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = L.user_id
      LEFT JOIN user_block UB2 ON UB2.user_id = L.user_id AND UB2.block_user_id = ?
      JOIN user U ON U.id = L.user_id AND U.is_deleted = 0
      WHERE L.is_liked = 1
      ${block_user}
      AND L.post_id IN (${placeholders})
      GROUP BY L.post_id`;
      const plcount = await this.db.query(plcount_sql, [user_id, user_id, ...post_ids]);

      const pcmcount_sql = `
      SELECT C.post_id, COUNT(*) AS comment_count
      FROM post_comment C
      LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = C.user_id
      LEFT JOIN user_block UB2 ON UB2.user_id = C.user_id AND UB2.block_user_id = ?
      JOIN user U ON U.id = C.user_id AND U.is_deleted = 0
      WHERE C.is_deleted = 0
      AND C.parent_comment_id IS NULL
      ${block_user}
      AND C.post_id IN (${placeholders})
      GROUP BY C.post_id`;
      const pcmcount = await this.db.query(pcmcount_sql, [user_id, user_id, ...post_ids]);

      const hashtag_sql = `
      SELECT PH.post_id, GROUP_CONCAT(DISTINCT H.tag SEPARATOR ',') AS hash_tag
      FROM post_hashtag PH
      JOIN hashtag H ON PH.hashtag_id = H.id
      WHERE H.is_deleted = 0
      AND PH.post_id IN (${placeholders})
      GROUP BY PH.post_id`;
      const hashtag = await this.db.query(hashtag_sql, [...post_ids]);

      const lkflag_sql = `
      SELECT post_id, is_liked
      FROM post_like
      WHERE user_id = ?
      AND post_id IN (${placeholders})`;
      const likeflag = await this.db.query(lkflag_sql, [user_id, ...post_ids]);

      const pimg_sql = `
      SELECT A.id
           , A.post_id
           , A.img
      FROM post_img A
      WHERE A.post_id IN (${placeholders})
      AND A.is_deleted = 0
      ORDER BY A.post_id ASC`;
      const pimg = await this.db.query(pimg_sql, [...post_ids]);

      const follow_sql = `
      SELECT COUNT(*) AS count
      FROM follow
      WHERE user_id = ? 
      AND following_id = ? 
      AND is_followed = 1`;
      const followflag = await this.db.query(follow_sql, [user_id, post[0].user_id]);

      const sports_sql = `
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
           , AC.winner_id
           , CASE WHEN AC.winner_id = D.team_id THEN D.name
                   WHEN AC.winner_id = E.team_id THEN E.name
                   ELSE NULL END AS winner_name
           , CASE WHEN AC.winner_id = D.team_id THEN D.kor_name
                   WHEN AC.winner_id = E.team_id THEN E.kor_name
                   ELSE NULL END AS winner_kor_name
           , CASE WHEN B.match_status = 1 THEN 'wait'
                  WHEN B.winner = 'home' AND AC.winner_id = D.team_id THEN 'hit'
                  WHEN B.winner = 'away' AND AC.winner_id = E.team_id THEN 'hit'
                  WHEN B.winner = 'draw' AND AC.winner_id = 'draw' THEN 'hit'
                  ELSE 'missed' END AS hit_flag
      FROM post A
      JOIN ts_daily_match B ON A.match_id = B.id
      JOIN ts_competition C ON B.competition_id = C.competition_id
      JOIN ts_team D ON B.home_team_id = D.team_id
      JOIN ts_team E ON B.away_team_id = E.team_id
      JOIN ts_match_status F ON B.match_status = F.status_code AND B.category = F.category
      LEFT JOIN analyze_pick AC ON A.id = AC.post_id
      WHERE A.id IN (${placeholders})`;
      const sports = await this.db.query(sports_sql, [...post_ids]);

      const likeCountMap = new Map(plcount.map(({post_id, like_count}) => [post_id, like_count]));
      const commentCountMap = new Map(pcmcount.map(({post_id, comment_count}) => [post_id, comment_count]));
      const hashTagMap = new Map(hashtag.map(({post_id, hash_tag}) => [post_id, hash_tag]));
      const likeFlagMap = new Map(likeflag.map(({post_id, is_liked}) => [post_id, is_liked]));
      const postImgMap = pimg.reduce((acc, item) => {
          if (!acc[item.post_id]) acc[item.post_id] = [];
          acc[item.post_id].push({ id: item.id, url: item.img });
          return acc;
      }, {});
      // 1. sports Map 제대로 만들기
      const sportsMap = new Map(sports.map(s => {
          return [s.post_id, {
              sports_match_id : s.sports_match_id,
              competition_id : s.competition_id,
              competition_name: s.competition_name,
              kor_competition_name : s.kor_competition_name,
              competition_logo: s.competition_logo,
              timeinfo: s.timeinfo,
              home_team_name: s.home_team_name,
              kor_home_team_name : s.kor_home_team_name,
              home_team_logo: s.home_team_logo,
              away_team_name: s.away_team_name,
              kor_away_team_name : s.kor_away_team_name,
              away_team_logo: s.away_team_logo,
              home_score: s.home_score,
              away_score: s.away_score,
              match_status: s.match_status,
              status_description: s.status_description,
              winner_id: s.winner_id,
              winner_name : s.winner_name,
              winner_kor_name : s.winner_kor_name,
              hit_flag : s.hit_flag
          }];
      }));

      const combine = post.map(post => {
        const { user_id, ...rest } = post;  // 🔥 user_id 제외
        return {
          ...rest,
          like_count : likeCountMap.get(post.id) || 0,
          comment_count : commentCountMap.get(post.id) || 0,
          hash_tag: hashTagMap.get(post.id) ? hashTagMap.get(post.id).split(',') : [],
          like_flag: likeFlagMap.get(post.id) || 0,
          follow_flag: followflag[0]?.count > 0 ? 1 : 0,
          files: postImgMap[post.id] || [],
          sports : sportsMap.get(post.id) || null
        };
      });

      return combine[0];
    } else {
      return [];
    }
  }

  async findComment(post_id : number, user_id : number) {

    let block_user = '';
    if(user_id) {
      block_user = 'AND UB1.block_user_id IS NULL AND UB2.block_user_id IS NULL'
    }

    const sql = `
    SELECT C.id AS comment_id
         , B.img
         , I.img AS insignia_img
         , B.nick_name
         , B.user_level
         , C.created_at
         , C.edited_at
         , C.content
          -- 👇 reply_count 추가
         , (
              SELECT COUNT(*)
              FROM post_comment RC
              LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = RC.user_id
              LEFT JOIN user_block UB2 ON UB2.user_id = RC.user_id AND UB2.block_user_id = ?
              WHERE RC.parent_comment_id = C.id
              AND RC.is_deleted = 0
              ${block_user}
          ) AS reply_count
    FROM post_comment C
    JOIN user B ON C.user_id = B.id
    LEFT JOIN insignia I ON B.insignia_level = I.insignia_level
    LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = C.user_id
    LEFT JOIN user_block UB2 ON UB2.user_id = C.user_id AND UB2.block_user_id = ?
    WHERE C.post_id = ?
    AND B.is_deleted = 0
    AND C.is_deleted = 0
    AND C.parent_comment_id IS NULL
    ${block_user}
    ORDER BY C.created_at DESC
    LIMIT 5`;

    const result = await this.db.query(sql, [user_id, user_id, user_id, user_id, post_id]);

    const comment_ids = result.map(id => id.comment_id);

    if(comment_ids.length > 0) {
      const placeholders = comment_ids.map(() => '?').join(','); // ?,?,?

      const plcount_sql = `
      SELECT L.comment_id, COUNT(*) AS like_count
      FROM post_comment_like L
      LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = L.user_id
      LEFT JOIN user_block UB2 ON UB2.user_id = L.user_id AND UB2.block_user_id = ?
      JOIN user U ON U.id = L.user_id AND U.is_deleted = 0
      WHERE L.is_liked = 1
      ${block_user}
      AND L.comment_id IN (${placeholders})
      GROUP BY L.comment_id`;
      const plcount = await this.db.query(plcount_sql, [user_id, user_id, ...comment_ids]);

      const lkflag_sql = `
      SELECT comment_id, is_liked
      FROM post_comment_like
      WHERE user_id = ?
      AND comment_id IN (${placeholders})`;
      const likeflag = await this.db.query(lkflag_sql, [user_id, ...comment_ids]);

      const reply_sql = `
      SELECT *
      FROM (
          SELECT 
              C.id AS comment_id,
              C.parent_comment_id,
              B.img,
              I.img AS insignia_img,
              B.nick_name,
              B.user_level,
              C.created_at,
              C.edited_at,
              C.content,
              ROW_NUMBER() OVER (PARTITION BY C.parent_comment_id ORDER BY C.created_at DESC) AS rn
          FROM post_comment C
          JOIN user B ON C.user_id = B.id
          LEFT JOIN insignia I ON B.insignia_level = I.insignia_level
          LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = C.user_id
          LEFT JOIN user_block UB2 ON UB2.user_id = C.user_id AND UB2.block_user_id = ?
          WHERE C.post_id = ?
          AND B.is_deleted = 0
          AND C.is_deleted = 0
          AND C.parent_comment_id IN (${placeholders})
          ${block_user}
      ) t
      WHERE t.rn <= 10
      ORDER BY created_at DESC;`;

      // reply 가져오기
      const replies = await this.db.query(reply_sql, [
        user_id, user_id, post_id, ...comment_ids
      ]);

      // reply를 parent_comment_id 기준으로 그룹핑
      const replyMap = new Map();

      for (const r of replies) {
        if (!replyMap.has(r.parent_comment_id)) {
          replyMap.set(r.parent_comment_id, []);
        }
        replyMap.get(r.parent_comment_id).push(r);
      }
      const likeCountMap = new Map(plcount.map(({comment_id, like_count}) => [comment_id, like_count]));
      const likeFlagMap = new Map(likeflag.map(({comment_id, is_liked}) => [comment_id, is_liked]));

      // 마지막에 comments에 붙이기
      const combined = result.map(comment => ({
        ...comment,
        like_count : likeCountMap.get(comment.comment_id) || 0,
        like_flag: likeFlagMap.get(comment.comment_id) || 0,
        reply: replyMap.get(comment.comment_id) || [],
      }));

      return combined;

    } 

  }

  
}