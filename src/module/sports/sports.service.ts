import { Injectable } from '@nestjs/common';
import { GetSportsDto } from './dto/getSports.dto';
import { SportsRepository } from './sports.repository';
import { GetSportsDetailDto } from './dto/getSportsDetail.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SportsService {

    constructor (
        private readonly sportsRepository : SportsRepository,
        private readonly configService : ConfigService
    ) {};

    async getSports(getSportsDto : GetSportsDto, user? : any) {

        const user_id = user?.user_id || null;
        const date = getSportsDto.date;
        const category = getSportsDto.category || '';
        const filter = getSportsDto.filter || '';
        const page_no = getSportsDto.page_no || 1;
        const limit = getSportsDto.limit || 10;

        // 날짜 처리
        let queryStartDate = '';
        let queryEndDate = '';

        if (date) {
            // "2025-06-25" -> "20250625"
            const formattedDate = date.replace(/-/g, '');

            // DB 검색 범위 생성
            const startDate = `${formattedDate}0000`;
            const endDate = `${formattedDate}2359`;

            queryStartDate = startDate;
            queryEndDate = endDate;
        }

        // 카테고리 조건 처리
        let categoryCondition = '';
        let categoryParams: string[] = [];
        
        if (category && category !== 'all') {
            categoryCondition = 'AND A.category = ?';
            categoryParams = [category];
        }

        let filterCondition = '';
        let filterParams : number[] = [];

        if(filter && filter != 'all') {
            switch(filter) {
                case 'live' :
                    switch(category) {
                        case 'soccer' :
                            filterCondition = 'AND A.match_status IN (?,?,?,?,?,?)';
                            filterParams = [2,3,4,5,6,7];
                            break;
                        case 'basketball' :
                            filterCondition = 'AND A.match_status IN (?,?,?,?,?,?,?,?)';
                            filterParams = [2,3,4,5,6,7,8,9];
                            break;
                        case 'baseball' :
                            filterCondition = 'AND A.match_status IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
                            filterParams = [432,433,434,435,436,437,438,439,440,411,412,413,414,415,416,417,418,419,420,421];
                            break;
                        case 'volleyball' :
                            filterCondition = 'AND A.match_status IN (?,?,?,?,?)';
                            filterParams = [432,434,436,438,440];
                            break;
                        case 'lol' :
                            filterCondition = 'AND A.match_status IN (?)';
                            filterParams = [2];
                            break;
                    }
                    break;
                case 'not_started' :
                    filterCondition = 'AND A.match_status = ?';
                    filterParams = [1];
                    break;
                case 'end' :
                    switch(category) {
                        case 'soccer' :
                            filterCondition = 'AND A.match_status IN (?,?,?,?,?,?)';
                            filterParams = [8,9,10,11,12,13];
                            break;
                        case 'basketball' :
                            filterCondition = 'AND A.match_status IN (?,?,?,?,?,?)';
                            filterParams = [10,11,12,13,14,15];
                            break;
                        case 'baseball' :
                            filterCondition = 'AND A.match_status IN (?,?,?,?,?,?,?)';
                            filterParams = [100,14,15,16,17,19,99];
                            break;
                        case 'volleyball' :
                            filterCondition = 'AND A.match_status IN (?,?,?,?,?,?,?)';
                            filterParams = [100,14,15,16,17,19,99];
                            break;
                        case 'lol' :
                            filterCondition = 'AND A.match_status IN (?,?,?,?,?,?)';
                            filterParams = [3,11,12,13,14,15];
                            break;
                    }
                    break;
            }
        }
        
        const findDailySportsTotal = await this.sportsRepository.findDailySportsTotal(
            user_id, queryStartDate, queryEndDate, categoryCondition, categoryParams, filterCondition, filterParams);
        const findDailySports = await this.sportsRepository.findDailySports(
            user_id, queryStartDate, queryEndDate, categoryCondition, categoryParams, filterCondition, filterParams, page_no, limit
        );

        const result = {
            total_count : findDailySportsTotal[0].count,
            total_page : Math.ceil(findDailySportsTotal[0].count / limit),
            sports : findDailySports
        }

        return result;

    }

    async getSportsDetail(getSportsDetailDto : GetSportsDetailDto, user? : any) {

        const user_id = user?.user_id || null;
        const sports_match_id = getSportsDetailDto.sports_match_id || '';
        const type = getSportsDetailDto.type || '';

        const sportsHeader = await this.sportsRepository.findSportsDetailHeader(sports_match_id, user_id);
        const category = sportsHeader[0].category;

        let sportsWidget = '';
        if(type === 'live') {
            sportsWidget = await this.getSportWidgetInLive(sports_match_id, category);
        }

        // info 조회 시 필요한 값
        const season_id = sportsHeader[0].season_id;
        const home_team_id = sportsHeader[0].home_team_id;
        const away_team_id = sportsHeader[0].away_team_id;
        let sportsInfo : any = '';
        if(type === 'info') {
            // headerRow 추가 전달
            sportsInfo = await this.getSportsInfo(sports_match_id, category, season_id, home_team_id, away_team_id, sportsHeader[0]);
        }

        let sportsLineup : any = '';
        if(type === 'lineup') {
            sportsLineup = await this.getSportsLineup(category, sports_match_id, season_id, home_team_id, away_team_id);
        }
        const result = {
            header : sportsHeader,
            widget : sportsWidget,
            info : sportsInfo,
            lineup : sportsLineup
        }
        return result;
    }

    async getSportWidgetInLive(sports_match_id : String, category : String) {

        const sports_match_ids = sports_match_id || '';

        const widgetUrl = `https://yagsill.com/widget?category=${encodeURIComponent(String(category))}&sports_match_id=${encodeURIComponent(String(sports_match_ids))}`;

        return widgetUrl;
    }

    async getSportsInfo(sports_match_id : String, category : String, season_id : String, home_team_id : String, away_team_id : String, headerRow?: any) {

        const sports_match_ids = sports_match_id || '';
        const season_ids = season_id || '';

        let url = '';

        switch(category) {
            case 'soccer' :
                url = this.configService.get<string>('THE_SPORTS_SOCCER_URL')!;
                break;
            case 'basketball' :
                url = this.configService.get<string>('THE_SPORTS_BASKETBALL_URL')!;
                break;
            case 'baseball' :
                url = this.configService.get<string>('THE_SPORTS_BASEBALL_URL')!;
                break;
            case 'volleyball' :
                url = this.configService.get<string>('THE_SPORTS_VOLLEYBALL_URL')!;
                break;
            case 'lol' :
                url = this.configService.get<string>('THE_SPORTS_LOL_URL')!;
                break;
        }

        let rank_set;
        try {
            if(category === 'soccer' || category === 'basketball') {
                rank_set = await axios.get(`${url}/season/recent/table/detail`, {
                    headers : { 'Accept' : 'application/json' },
                    params : {
                        user: this.configService.get<string>('THE_SPORTS_API_USER')!,
                        secret: this.configService.get<string>('THE_SPORTS_API_SECRET_KEY')!,
                        uuid : season_id
                    }
                });
            } else if (category === 'baseball' || category === 'volleyball') {
                rank_set = await axios.get(`${url}/season/table/detail`, {
                    headers: { 'Accept': 'application/json' },
                    params: {
                        user: this.configService.get<string>('THE_SPORTS_API_USER')!,
                        secret: this.configService.get<string>('THE_SPORTS_API_SECRET_KEY')!,
                        uuid : season_id
                    }
                });
            }
        } catch(e) {
            // 실패해도 진행
        }

        if(category === 'soccer') {
            return await this.getSportsSoccerInInfo(rank_set, headerRow, url, String(sports_match_id));
        }

        if(category === 'basketball') {
            return await this.getSportsBasketBallInInfo(rank_set, headerRow, url, String(sports_match_id));
        }

        if(category === 'baseball' || category === 'volleyball') {
            return await this.getSportsBaseballAndVolleyBallInInfo(rank_set, headerRow);
        }

        if(category === 'lol') {
            return await this.getSportsLolInInfo(rank_set, headerRow, url);
        }

        // 다른 종목은 rank_set 원본 또는 null 반환 (필요 시 확장)
        return { rank_raw: rank_set?.data || null };
    }

    async getSportsSoccerInInfo(rank_set : any, headerRow : any, url : string, match_id : string) {
        if(!headerRow) return null;
        const selected = [headerRow];
        const configUser = this.configService.get<string>('THE_SPORTS_API_USER')!;
        const configSecret = this.configService.get<string>('THE_SPORTS_API_SECRET_KEY')!;

        const data : any = {};

        if(selected[0].category === 'soccer') {
            let homeTeamRankInfo : any;
            let awayTeamRankInfo : any;

            if(selected[0].home_team_id && selected[0].away_team_id) {
                if(rank_set?.data?.results?.tables && Array.isArray(rank_set.data.results.tables) && rank_set.data.results.tables.length > 0) {
                    for (const table of rank_set.data.results.tables) {
                        if (table.rows && Array.isArray(table.rows) && table.rows.length > 0) {
                            for (const row of table.rows) {
                                if (row.team_id === selected[0].home_team_id) {
                                    homeTeamRankInfo = {
                                        team_id: row.team_id,
                                        team_name: row.team_name || selected[0].home_team_name,
                                        kor_team_name : selected[0].kor_home_team_name,
                                        position: row.position,
                                        points: row.points || 0,
                                        total : row.total || 0,
                                        won: row.won || 0,
                                        draw: row.draw || 0,
                                        loss: row.loss || 0,
                                        goals : row.goals || 0,
                                        goals_against : row.goals_against || 0,
                                        goal_diff: row.goal_diff || 0,
                                    };
                                }
                                if (row.team_id === selected[0].away_team_id) {
                                    awayTeamRankInfo = {
                                        team_id: row.team_id,
                                        team_name: row.team_name || selected[0].away_team_name,
                                        kor_team_name : selected[0].kor_away_team_name,
                                        position: row.position,
                                        points: row.points || 0,
                                        total : row.total || 0,
                                        won: row.won || 0,
                                        draw: row.draw || 0,
                                        loss: row.loss || 0,
                                        goals : row.goals || 0,
                                        goals_against : row.goals_against || 0,
                                        goal_diff: row.goal_diff || 0,
                                    };
                                }
                                if (homeTeamRankInfo && awayTeamRankInfo) break;
                            }
                            if (homeTeamRankInfo && awayTeamRankInfo) break;
                        }
                    }
                }

                data.rank = {
                    home_team_info: homeTeamRankInfo,
                    away_team_info: awayTeamRankInfo
                };

                let record : any[] = [];
                let summary : any = null;

                try {
                    const response = await axios.get(`${url}/match/analysis`, {
                        headers: { 'Accept': 'application/json' },
                        params: {
                            user: configUser,
                            secret: configSecret,
                            uuid : match_id
                        }
                    });

                    if (response?.data?.results?.history?.vs && Array.isArray(response.data.results.history.vs)) {
                        const vsHistory = response.data.results.history.vs;
                        const homeId = selected[0].home_team_id;
                        const awayId = selected[0].away_team_id;
                        const homeName = selected[0].home_team_name;
                        const korHomeName = selected[0].kor_home_team_name;
                        const awayName = selected[0].away_team_name;
                        const korAwayName = selected[0].kor_away_team_name;
                        const homeLogo = selected[0].home_team_logo;
                        const awayLogo = selected[0].away_team_logo;

                        const filteredMatches = vsHistory.filter((m: any) => {
                            const h = m[5][0];
                            const a = m[6][0];
                            return [h, a].includes(homeId) && [h, a].includes(awayId);
                        });

                        const matches = filteredMatches.map((m: any) => {
                            const home = m[5];
                            const away = m[6];
                            const date = new Date(m[3] * 1000).toISOString().replace('T', ' ').substring(0, 19);
                            const competition = (m[9]?.[1] || '') + ' ' + (selected[0].competition_name || '');
                            const kor_competition = (m[9]?.[1] || '') + ' ' + (selected[0].kor_competition_name || '');
                            const home_team_name = home[0] === homeId ? homeName : awayName;
                            const kor_home_team_name = home[0] === homeId ? korHomeName : korAwayName;
                            const home_team_logo = home[0] === homeId ? homeLogo : awayLogo;
                            const away_team_name = away[0] === awayId ? awayName : homeName;
                            const kor_away_team_name = away[0] === awayId ? korAwayName : korHomeName;
                            const away_team_logo = home[0] === homeId ? awayLogo : homeLogo;
                            return {
                                date,
                                competition,
                                kor_competition,
                                home_team_id: home[0],
                                home_team_name,
                                kor_home_team_name,
                                home_team_logo,
                                home_points: home[2],
                                away_team_id: away[0],
                                away_team_name,
                                kor_away_team_name,
                                away_team_logo,
                                away_points: away[2],
                            };
                        });

                        const latest10 = matches.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
                        let homeWins = 0, awayWins = 0, draws = 0;
                        for (const m of latest10) {
                            const hp = Number(m.home_points) || 0;
                            const ap = Number(m.away_points) || 0;
                            if (hp === ap) { draws++; continue; }
                            const winnerId = hp > ap ? m.home_team_id : m.away_team_id;
                            if (winnerId === homeId) homeWins++; else if (winnerId === awayId) awayWins++;
                        }
                        const total = homeWins + awayWins + draws;
                        const homeRate = total > 0 ? Math.round((homeWins / total) * 100) : 0;
                        const awayRate = total > 0 ? Math.round((awayWins / total) * 100) : 0;
                        summary = {
                            home_team_name: homeName,
                            kor_home_team_name : korHomeName,
                            away_team_name: awayName,
                            kor_away_team_name : korAwayName,
                            home_wins: homeWins,
                            away_wins: awayWins,
                            draws: draws,
                            total_matches: total,
                            home_win_rate: homeRate,
                            away_win_rate: awayRate
                        };
                        record = latest10;
                    }
                } catch(e) {
                    // 분석 API 실패 시 빈 값 유지
                }

                data.record = record;
                data.summary = summary;
            }
        }
        return data;
    }

    async getSportsBasketBallInInfo(rank_set : any, headerRow : any, url : string, match_id : string) {
        if(!headerRow) return null;
        const selected = [headerRow];
        const configUser = this.configService.get<string>('THE_SPORTS_API_USER')!;
        const configSecret = this.configService.get<string>('THE_SPORTS_API_SECRET_KEY')!;

        const data : any = {};

        if(selected[0].category === 'basketball') {
            let homeTeamRankInfo : any = null;
            let awayTeamRankInfo : any = null;

            if(selected[0].home_team_id && selected[0].away_team_id) {
                const results = rank_set?.data?.results ?? [];
                for (const table of results) {
                    const rows = table?.rows ?? [];
                    for (const row of rows) {
                        const teamId = row?.team_id;
                        if (!teamId) continue;

                        const teamInfo = {
                            team_id: teamId,
                            team_name: row?.name || (teamId === selected[0].home_team_id ? selected[0].home_team_name : selected[0].away_team_name),
                            kor_team_name : (teamId === selected[0].home_team_id ? selected[0].kor_home_team_name : selected[0].kor_away_team_name),
                            position: row?.position ?? null,
                            points: row?.points ?? 0,
                            won: row?.won ?? 0,
                            lost: row?.lost ?? 0,
                            won_rate: row?.won_rate ?? 0,
                            points_avg: row?.points_avg ?? 0,
                            points_against_avg: row?.points_against_avg ?? 0,
                            diff_avg: row?.diff_avg ?? 0,
                            streaks: row?.streaks ?? 0,
                            home: row?.home ?? '-',
                            away: row?.away ?? '-',
                            division: row?.division ?? '-',
                            conference: row?.conference ?? '-',
                            last_10: row?.last_10 ?? '-'
                        };

                        if (teamId === selected[0].home_team_id) homeTeamRankInfo = teamInfo;
                        if (teamId === selected[0].away_team_id) awayTeamRankInfo = teamInfo;
                        if (homeTeamRankInfo && awayTeamRankInfo) break;
                    }
                    if (homeTeamRankInfo && awayTeamRankInfo) break;
                }

                data.rank = {
                    home_team_info: homeTeamRankInfo ?? null,
                    away_team_info: awayTeamRankInfo ?? null
                };

                let record : any[] = [];
                let summary : any = null;

                try {
                    const response = await axios.get(`${url}/match/analysis`, {
                        headers: { 'Accept': 'application/json' },
                        params: {
                            user: configUser,
                            secret: configSecret,
                            uuid : match_id
                        }
                    });

                    if (response?.data?.results?.history?.vs && Array.isArray(response.data.results.history.vs)) {
                        const vsHistory = response.data.results.history.vs;
                        const homeId = selected[0].home_team_id;
                        const awayId = selected[0].away_team_id;
                        const homeName = selected[0].home_team_name;
                        const korHomeName = selected[0].kor_home_team_name;
                        const awayName = selected[0].away_team_name;
                        const korAwayName = selected[0].kor_away_team_name;
                        const homeLogo = selected[0].home_team_logo;
                        const awayLogo = selected[0].away_team_logo;

                        const matches : any[] = [];
                        for (const m of vsHistory) {
                            const teamArrays = Array.isArray(m)
                                ? m.filter((x: any) => Array.isArray(x) && typeof x[0] === 'string')
                                : [];
                            if (teamArrays.length < 2) continue;

                            const teamHomeArr = teamArrays.find((a: any) => a[0] === homeId);
                            const teamAwayArr = teamArrays.find((a: any) => a[0] === awayId);
                            if (!teamHomeArr || !teamAwayArr) continue;

                            const ts: any = (Array.isArray(m) ? m.find((v: any) => typeof v === 'number' && v > 1e9) : null) ?? (m[4] ?? null);
                            const date = ts ? new Date(ts * 1000).toISOString().replace('T', ' ').substring(0, 19) : null;

                            const toPeriods = (arr: any[]) => Array.isArray(arr) ? arr.slice(2, 10).map(v => {
                                const n = Number(v); return Number.isFinite(n) ? n : 0;
                            }) : [];
                            const sum = (arr: number[]) => arr.reduce((s, x) => s + (Number.isFinite(x) ? x : 0), 0);

                            const homePeriods = toPeriods(teamHomeArr);
                            const awayPeriods = toPeriods(teamAwayArr);

                            matches.push({
                                date,
                                competition: (m[9]?.[1] || '') + ' ' + (selected[0].competition_name || ''),
                                kor_competition : (m[9]?.[1] || '') + ' ' + (selected[0].kor_competition_name || ''),
                                home_team_id: teamHomeArr[0],
                                home_team_name: homeName,
                                kor_home_team_name : korHomeName,
                                home_team_logo: homeLogo,
                                home_points: sum(homePeriods),
                                away_team_id: teamAwayArr[0],
                                away_team_name: awayName,
                                kor_away_team_name : korAwayName,
                                away_team_logo: awayLogo,
                                away_points: sum(awayPeriods)
                            });
                        }

                        const latest10 = matches
                            .sort((a: any, b: any) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime())
                            .slice(0, 10);

                        let homeWins = 0, awayWins = 0, draws = 0;
                        latest10.forEach((m: any) => {
                            if (m.home_points > m.away_points) {
                                if (m.home_team_id === homeId) homeWins++; else awayWins++;
                            } else if (m.home_points < m.away_points) {
                                if (m.away_team_id === awayId) awayWins++; else homeWins++;
                            } else {
                                draws++;
                            }
                        });

                        const total = homeWins + awayWins + draws;
                        const homeRate = total > 0 ? Math.round((homeWins / total) * 100) : 0;
                        const awayRate = total > 0 ? Math.round((awayWins / total) * 100) : 0;

                        summary = {
                            home_team_name: homeName,
                            kor_home_team_name : korHomeName,
                            away_team_name: awayName,
                            kor_away_team_name : korAwayName,
                            home_wins: homeWins,
                            away_wins: awayWins,
                            draws,
                            total_matches: total,
                            home_win_rate: homeRate,
                            away_win_rate: awayRate
                        };
                        record = latest10;
                    }
                } catch(e) {
                    // 분석 API 실패 시 빈 값 유지
                }

                data.record = record;
                data.summary = summary;
            }
        }
        return data;
    }

    async getSportsBaseballAndVolleyBallInInfo(rank_set : any, headerRow : any) {
        if(!headerRow) return null;
        const selected = [headerRow];

        const data : any = {};

        if (selected[0].category === 'baseball' || selected[0].category === 'volleyball') {
            if (selected[0].home_team_id && selected[0].away_team_id) {
                let homeTeamRankInfo : any = null;
                let awayTeamRankInfo : any = null;

                // rank_set 구조가 여러 형태로 올 수 있으므로 안전하게 rows 추출
                const resultsData = rank_set?.data?.results ?? rank_set?.data ?? [];
                let rows : any[] = [];
                if (Array.isArray(resultsData)) {
                    rows = resultsData;
                } else if (Array.isArray(resultsData.tables) && resultsData.tables.length > 0) {
                    for (const t of resultsData.tables) {
                        if (Array.isArray(t.rows)) rows.push(...t.rows);
                    }
                } else if (Array.isArray(resultsData.rows)) {
                    rows = resultsData.rows;
                }

                for (const row of rows) {
                    const teamId = row?.team_id ?? row?.teamId ?? row?.team ?? null;
                    if (!teamId) continue;
                    const teamInfo = {
                        team_id: teamId,
                        team_name: row?.name ?? row?.team_name ?? (teamId === selected[0].home_team_id ? selected[0].home_team_name : selected[0].away_team_name),
                        kor_team_name : (teamId === selected[0].home_team_id ? selected[0].kor_home_team_name : selected[0].kor_away_team_name),
                        position: row?.position ?? row?.pos ?? null,
                        total: row?.total ?? row?.played ?? 0,
                        won: row?.win ?? row?.won ?? row?.w ?? 0,
                        draw: row?.draw ?? row?.d ?? 0,
                        loss: row?.loss ?? row?.lost ?? row?.l ?? 0,
                        goals: row?.goals ?? row?.for ?? 0,
                        goals_against: row?.goals_against ?? row?.against ?? 0,
                        win_rate: row?.win_rate ?? row?.won_rate ?? row?.winRate ?? 0
                    };
                    if (teamId === selected[0].home_team_id) homeTeamRankInfo = teamInfo;
                    if (teamId === selected[0].away_team_id) awayTeamRankInfo = teamInfo;
                    if (homeTeamRankInfo && awayTeamRankInfo) break;
                }

                data.rank = {
                    home_team_info: homeTeamRankInfo ?? null,
                    away_team_info: awayTeamRankInfo ?? null
                };

                // 최근 맞대결 10경기: 내부 DB에서 조회
                const rowsH2H = await this.sportsRepository.findRecentHeadToHead(selected[0].home_team_id, selected[0].away_team_id, 10);

                const parseFirst = (s: any) => {
                    if (s == null) return 0;
                    if (Array.isArray(s)) return Number(s[0] || 0);
                    if (typeof s === 'string') {
                        const trimmed = s.trim();
                        try {
                            if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                                const p = JSON.parse(trimmed);
                                if (Array.isArray(p)) return Number(p[0] || 0);
                            }
                        } catch {}
                        if (trimmed.includes(',')) {
                            const parts = trimmed.split(',').map(t => t.trim());
                            const n = Number(parts[0]);
                            return Number.isFinite(n) ? n : 0;
                        }
                        const n = Number(trimmed);
                        return Number.isFinite(n) ? n : 0;
                    }
                    const n = Number(s);
                    return Number.isFinite(n) ? n : 0;
                };

                const record = rowsH2H.map((r: any) => ({
                    date: r.timeinfo,
                    season: r.competition_name,
                    korSeason: r.kor_competition_name,
                    home_team_id: r.home_team_id,
                    home_team_name: r.home_team_name,
                    kor_home_team_name: r.kor_home_team_name,
                    home_team_logo: r.home_team_logo,
                    away_team_id: r.away_team_id,
                    away_team_name: r.away_team_name,
                    kor_away_team_name: r.kor_away_team_name,
                    away_team_logo: r.away_team_logo,
                    home_points: parseFirst(r.home_score),
                    away_points: parseFirst(r.away_score)
                }));

                // summary 계산
                const recent = record.slice(0, 10);
                let homeWins = 0, awayWins = 0, draws = 0;
                for (const m of recent) {
                    const hp = Number(m.home_points) || 0;
                    const ap = Number(m.away_points) || 0;
                    if (hp > ap) {
                        if (m.home_team_id === selected[0].home_team_id) homeWins++; else awayWins++;
                    } else if (hp < ap) {
                        if (m.away_team_id === selected[0].away_team_id) awayWins++; else homeWins++;
                    } else {
                        draws++;
                    }
                }
                const total = homeWins + awayWins + draws;
                const homeRate = total > 0 ? Math.round((homeWins / total) * 100) : 0;
                const awayRate = total > 0 ? Math.round((awayWins / total) * 100) : 0;

                data.record = record;
                data.summary = {
                    home_team_name: selected[0].home_team_name,
                    kor_home_team_name: selected[0].kor_home_team_name,
                    away_team_name: selected[0].away_team_name,
                    kor_away_team_name: selected[0].kor_away_team_name,
                    home_wins: homeWins,
                    away_wins: awayWins,
                    draws,
                    total_matches: total,
                    home_win_rate: homeRate,
                    away_win_rate: awayRate
                };
            }
        }
        return data;
    }

    async getSportsLolInInfo(rank_set: any, headerRow: any, url: string) {
        if(!headerRow) return null;
        const selected = [headerRow];
        const data: any = {};
        if(selected[0].category !== 'lol') return data;
        if(!(selected[0].home_team_id && selected[0].away_team_id)) return data;

        const configUser = this.configService.get<string>('THE_SPORTS_API_USER')!;
        const configSecret = this.configService.get<string>('THE_SPORTS_API_SECRET_KEY')!;
        try {
            const statsResp = await axios.get(`${url}/tournament/stats`, {
                headers: { 'Accept': 'application/json' },
                params: { user: configUser, secret: configSecret, uuid: selected[0].competition_id }
            });
            const teams = statsResp.data?.results?.teams || [];
            const findTeamById = (id: any) => teams.find((t: any) => t?.id === id) || null;
            const homeTeamEntry = findTeamById(selected[0].home_team_id);
            const awayTeamEntry = findTeamById(selected[0].away_team_id);
            const extractStats = (entry: any) => ({ id: entry?.id || null, stats: Array.isArray(entry?.stats) ? entry.stats : [] });
            const statKeys = [
                'kda','win_rate','avg_kills_per_match','avg_deaths_per_match','avg_damage_per_minute','avg_economy_per_minute','avg_cs_per_minute','first_blood_pct','first_tower_pct','avg_towers_destroyed_per_match','avg_towers_been_destroyed_per_match','first_drake_pct','avg_drakes_per_match','drake_control_pct','first_nashor_pct','avg_nashor_per_match','nashor_control_pct','avg_duration_per_minute','full_matches_pct','matches_played'
            ];
            const mapStats = (arr: any[]) => { const obj: any = {}; statKeys.forEach((k, i) => { obj[k] = (Array.isArray(arr) && typeof arr[i] !== 'undefined') ? arr[i] : null; }); return obj; };
            const homeTeamStats = extractStats(homeTeamEntry);
            const awayTeamStats = extractStats(awayTeamEntry);
            // 루트에 직접 home / away 배치
            data.home = {
                home_team_name: selected[0].home_team_name,
                kor_home_team_name: selected[0].kor_home_team_name,
                home_team_id: selected[0].home_team_id,
                stats: mapStats(homeTeamStats.stats)
            };
            data.away = {
                away_team_name: selected[0].away_team_name,
                kor_away_team_name: selected[0].kor_away_team_name,
                away_team_id: selected[0].away_team_id,
                stats: mapStats(awayTeamStats.stats)
            };
            // 순위(position) 조회
            const dataIds = await this.sportsRepository.findLolTeamDataIds(selected[0].home_team_id, selected[0].away_team_id, selected[0].competition_id);
            const homeDataId = dataIds.find((r: any) => r.team_id === selected[0].home_team_id)?.data_id;
            const awayDataId = dataIds.find((r: any) => r.team_id === selected[0].away_team_id)?.data_id;
            const fetchPosition = async (pid: any) => {
                if(!pid) return null;
                try {
                    const resp = await axios.get(`${url}/tournament/table/list`, {
                        headers: { 'Accept': 'application/json' },
                        params: { user: configUser, secret: configSecret, uuid: pid }
                    });
                    return resp.data?.results?.[0]?.position ?? null;
                } catch { return null; }
            };
            data.home.position = await fetchPosition(homeDataId);
            data.away.position = await fetchPosition(awayDataId);
        } catch(e) {
            // 실패 시 빈 데이터 유지
        }
        return data;
    }

    async getSportsLineup(category: string, match_id: string, competition_id: string, home_team_id: string, away_team_id: string) {
        const data: any = {};
        if(!(home_team_id && away_team_id)) return data;

        let url = '';
        switch(category) {
            case 'soccer': url = this.configService.get<string>('THE_SPORTS_SOCCER_URL')!; break;
            case 'basketball': url = this.configService.get<string>('THE_SPORTS_BASKETBALL_URL')!; break;
            case 'baseball': url = this.configService.get<string>('THE_SPORTS_BASEBALL_URL')!; break;
            case 'lol': url = this.configService.get<string>('THE_SPORTS_LOL_URL')!; break;
            case 'volleyball': url = this.configService.get<string>('THE_SPORTS_VOLLEYBALL_URL')!; break;
            default: return data;
        }

        const apiUser = this.configService.get<string>('THE_SPORTS_API_USER')!;
        const apiKey = this.configService.get<string>('THE_SPORTS_API_SECRET_KEY')!;

        // 공통 팀명
        data.home_team_name = data.home_team_name || null;
        data.away_team_name = data.away_team_name || null;

        try {
            if(category === 'soccer') {
                
                const resp = await axios.get(`${url}/match/lineup/detail`, {
                    headers: { 'Accept': 'application/json' },
                    params: { user: apiUser, secret: apiKey, uuid: match_id }
                });

                const lineupData = resp.data?.results;
                data.home_team_formation = lineupData?.home_formation || null;
                data.away_team_formation = lineupData?.away_formation || null;
                data.home_team_lineup = Array.isArray(lineupData?.lineup?.home) ? lineupData.lineup.home.map((p: any) => ({
                    id: p.id || null,
                    first: p.first || null,
                    captain: p.captain || null,
                    name: p.name || null,
                    logo: p.logo || null,
                    shirt_number: Number(p.shirt_number) || 0,
                    position: p.position || null,
                    x: p.x || null,
                    y: p.y || null
                })) : [];

                data.away_team_lineup = Array.isArray(lineupData?.lineup?.away) ? lineupData.lineup.away.map((p: any) => ({
                    id: p.id || null,
                    first: p.first || null,
                    captain: p.captain || null,
                    name: p.name || null,
                    logo: p.logo || null,
                    shirt_number: Number(p.shirt_number) || 0,
                    position: p.position || null,
                    x: p.x || null,
                    y: p.y || null
                })) : [];

                data.home_team_injury = Array.isArray(lineupData?.injury?.home) ? lineupData.injury.home.map((p: any) => ({
                    id: p.id || null,
                    name: p.name || null,
                    position: p.position || null,
                    logo: p.logo || null,
                    injury_id: p.injury_id || null,
                    reason: p.reason || null
                })) : [];

                data.away_team_injury = Array.isArray(lineupData?.injury?.away) ? lineupData.injury.away.map((p: any) => ({
                    id: p.id || null,
                    name: p.name || null,
                    position: p.position || null,
                    logo: p.logo || null,
                    injury_id: p.injury_id || null,
                    reason: p.reason || null
                })) : [];

            } else if (category === 'basketball') {
                // 라인업
                const homeSquad = await axios.get(`${url}/team/squad/list`, { headers: { 'Accept': 'application/json' }, params: { user: apiUser, secret: apiKey, uuid: home_team_id }});
                const awaySquad = await axios.get(`${url}/team/squad/list`, { headers: { 'Accept': 'application/json' }, params: { user: apiUser, secret: apiKey, uuid: away_team_id }});
                data.home_team_lineup = homeSquad.data?.results?.[0]?.squad?.map((p: any) => ({
                    player_id: p.player?.id || null,
                    name: p.player?.name || null,
                    position: p.position || null,
                    shirt_number: Number(p.shirt_number) || 0
                })) || [];
                data.away_team_lineup = awaySquad.data?.results?.[0]?.squad?.map((p: any) => ({
                    player_id: p.player?.id || null,
                    name: p.player?.name || null,
                    position: p.position || null,
                    shirt_number: Number(p.shirt_number) || 0
                })) || [];
                // 부상
                const homeInjury = await axios.get(`${url}/team/injury/list`, { headers: { 'Accept': 'application/json' }, params: { user: apiUser, secret: apiKey, uuid: home_team_id }});
                const awayInjury = await axios.get(`${url}/team/injury/list`, { headers: { 'Accept': 'application/json' }, params: { user: apiUser, secret: apiKey, uuid: away_team_id }});
                data.home_team_injury = homeInjury.data?.results?.[0]?.injury?.map((p: any) => ({ player_id: p.player_id || null, reason: p.reason || null })) || [];
                data.away_team_injury = awayInjury.data?.results?.[0]?.injury?.map((p: any) => ({ player_id: p.player_id || null, reason: p.reason || null })) || [];
            } else if (category === 'baseball') {
                const homeSquad = await axios.get(`${url}/team/squad/list`, { headers: { 'Accept': 'application/json' }, params: { user: apiUser, secret: apiKey, uuid: home_team_id }});
                data.home_team_lineup = homeSquad.data?.results?.[0]?.squad?.map((p: any) => ({
                    player_id: p.player_id || null,
                    position: p.position || null,
                    shirt_number: Number(p.shirt_number) || 0
                })) || [];
                const awaySquad = await axios.get(`${url}/team/squad/list`, { headers: { 'Accept': 'application/json' }, params: { user: apiUser, secret: apiKey, uuid: away_team_id }});
                data.away_team_lineup = awaySquad.data?.results?.[0]?.squad?.map((p: any) => ({
                    player_id: p.player_id || null,
                    position: p.position || null,
                    shirt_number: Number(p.shirt_number) || 0
                })) || [];
                // 부상
                const homeInjury = await axios.get(`${url}/team/injury/list`, { headers: { 'Accept': 'application/json' }, params: { user: apiUser, secret: apiKey, uuid: home_team_id }});
                data.home_team_injury = homeInjury.data?.results?.[0]?.injury?.map((p: any) => ({ player_id: p.player_id || null, reason: p.reason || null })) || [];
                const awayInjury = await axios.get(`${url}/team/injury/list`, { headers: { 'Accept': 'application/json' }, params: { user: apiUser, secret: apiKey, uuid: away_team_id }});
                data.away_team_injury = awayInjury.data?.results?.[0]?.injury?.map((p: any) => ({ player_id: p.player_id || null, reason: p.reason || null })) || [];
            } else if (category === 'lol') {
                const homeLineup = await this.sportsRepository.findLolTeamLineup(home_team_id);
                const awayLineup = await this.sportsRepository.findLolTeamLineup(away_team_id);
                data.home_team_lineup = homeLineup;
                data.away_team_lineup = awayLineup;
            }
        } catch(e) {
            // 실패 시 부분 데이터만 반환
        }
        return data;
    }
}
