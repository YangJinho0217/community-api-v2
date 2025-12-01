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

  async findDailySportsTotal(
    user_id : number | 0,
    queryStartDate : string | '',
    queryEndDate : string | '',
    categoryCondition: string,
    categoryParams: any[],
    filterCondition: string,
    filterParams: any[]) {

        const sql = `
        SELECT COUNT(A.id) AS count
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
        ${filterCondition}`;
        const result = await this.db.query(sql, [user_id, queryStartDate, queryEndDate, ...categoryParams, ...filterParams])
        return result;
  }

  async findDailySports(
    user_id : number | 0,
    queryStartDate : string | '',
    queryEndDate : string | '',
    categoryCondition: string,
    categoryParams: any[],
    filterCondition: string,
    filterParams: any[],
    page_no : number | 1,
    limit : number | 10) {

        const offset = (page_no - 1) * limit;
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
               CASE 
                   WHEN AP.match_id IS NOT NULL THEN 1
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
        ${filterCondition}
        LIMIT ${limit} OFFSET ${offset}`;
        const result = await this.db.query(sql, [user_id, queryStartDate, queryEndDate, ...categoryParams, ...filterParams])
        return result;
  }

  async findSportsDetailHeader(sports_match_id : String, user_id : Number) {
    const sql = `
    SELECT -- A.id,
           A.match_id AS sports_match_id,
           A.home_team_id,
           C.name AS home_team_name,
           C.kor_name AS kor_home_team_name,
           C.logo AS home_team_logo,
           A.away_team_id,
           D.name AS away_team_name,
           D.kor_name AS kor_away_team_name,
           D.logo AS away_team_logo,
           A.competition_id,
           B.name AS competition_name,
           B.kor_name AS kor_competition_name,
           B.logo AS competition_logo,
           A.season_id,
           A.category,
           A.match_status,
           E.status_description,
           STR_TO_DATE(CAST(A.matchtime AS CHAR), '%Y%m%d%H%i') AS timeinfo,
           -- A.home_score,
           -- A.away_score,
           CASE WHEN AP.match_id IS NOT NULL THEN 1
               ELSE 0
           END AS is_bookmark
    FROM ts_daily_match A
    JOIN ts_competition B ON A.competition_id = B.competition_id
    JOIN ts_team C ON A.home_team_id = C.team_id
    JOIN ts_team D ON A.away_team_id = D.team_id
    JOIN ts_match_status E ON A.match_status = E.status_code AND A.category = E.category
    LEFT JOIN user_bookmark AP ON A.id = AP.match_id AND AP.user_id = ?
    WHERE A.match_id = ?;`;
    const result = await this.db.query(sql, [user_id, sports_match_id]);
    return result;
  }

  async findSportsCategory(sports_match_id : String) {
    const sql = `
    SELECT category
    FROM ts_daily_match
    WHERE match_id = ?
    LIMIT 1`;
    const result = await this.db.query(sql, [sports_match_id]);
    return result;
  }

  async findRecentHeadToHead(homeTeamId: string | number, awayTeamId: string | number, limit: number = 10) {
    const lim = Math.max(1, Math.min(50, Number(limit) || 10));
    const sql = `
      SELECT STR_TO_DATE(CAST(A.matchtime AS CHAR), '%Y%m%d%H%i') AS timeinfo,
             B.name AS competition_name,
             B.kor_name AS kor_competition_name,
             A.home_team_id,
             C.name AS home_team_name,
             C.kor_name AS kor_home_team_name,
             C.logo AS home_team_logo,
             A.away_team_id,
             D.name AS away_team_name,
             D.kor_name AS kor_away_team_name,
             D.logo AS away_team_logo,
             A.home_score,
             A.away_score
      FROM ts_daily_match A
      JOIN ts_competition B ON A.competition_id = B.competition_id 
      JOIN ts_team C ON A.home_team_id = C.team_id
      JOIN ts_team D ON A.away_team_id = D.team_id
      WHERE ((A.home_team_id = ? AND A.away_team_id = ?)
          OR (A.home_team_id = ? AND A.away_team_id = ?))
      ORDER BY A.matchtime DESC
      LIMIT ${lim}`;
    return this.db.query(sql, [homeTeamId, awayTeamId, awayTeamId, homeTeamId]);
  }

  async findLolTeamDataIds(homeTeamId: string | number, awayTeamId: string | number, competitionId: string | number) {
    const sql = `
      SELECT data_id, competition_id, team_id
      FROM ts_lol_tot
      WHERE team_id IN (?,?)
        AND competition_id = ?
      ORDER BY FIELD(team_id, ?, ?)`; // 홈/어웨이 순서 유지
    return this.db.query(sql, [homeTeamId, awayTeamId, competitionId, homeTeamId, awayTeamId]);
  }
}
