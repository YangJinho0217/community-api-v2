// src/modules/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PoolConnection } from 'mysql2/promise';

@Injectable()
export class CommentRepository {
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

  async findCommentTotal(post_id : number, user_id : number) {

    let block_user = '';
    if(user_id) {
      block_user = 'AND UB1.block_user_id IS NULL AND UB2.block_user_id IS NULL'
    }

    const sql = `
    SELECT COUNT(C.id) AS count
    FROM post_comment C
    JOIN user B ON C.user_id = B.id
    LEFT JOIN insignia I ON B.insignia_level = I.insignia_level
    LEFT JOIN user_block UB1 ON UB1.user_id = ? AND UB1.block_user_id = C.user_id
    LEFT JOIN user_block UB2 ON UB2.user_id = C.user_id AND UB2.block_user_id = ?
    WHERE C.post_id = ?
    AND B.is_deleted = 0
    AND C.is_deleted = 0
    AND C.parent_comment_id IS NULL
    ${block_user}`;

    const result = await this.db.query(sql, [user_id, user_id, post_id]);
    return result;
  }

  async findComment(post_id : number, user_id : number, filterCondition : string, page_no : number, limit : number) {

    let block_user = '';
    if(user_id) {
      block_user = 'AND UB1.block_user_id IS NULL AND UB2.block_user_id IS NULL'
    }
    const offset = (page_no - 1) * limit;
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
    ${filterCondition}
    LIMIT ${limit} OFFSET ${offset}`;

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
      -- WHERE t.rn <= 10
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
