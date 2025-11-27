import { Injectable } from '@nestjs/common';
import { HomeRepository } from './home.repository';
import { GetHomeDto } from './dto/getHome.dto';
import { GetLiveScoreDto } from './dto/getLiveScore.dto';
import { GetAnalyzePicksDto } from './dto/getAnalyzePicks.dto';
import { GetNewsDto } from './dto/getNews.dto';
import { GetPostTopTenDto } from './dto/getPostTopTen.dto';
import { GetInjuryDto } from './dto/getInjury.dto';
import { GetLineupDto } from './dto/getLineup.dto';
import { GetAnalyzeMatchDto } from './dto/getAnalyzeMatch.dto';
import { SearchRpository } from '../search/search.repository';

@Injectable()
export class HomeService {

    constructor (
        readonly homeRepository : HomeRepository,
        readonly searchRepository : SearchRpository
    ) {}

    // 팝업 조회 (단독 메서드)
    async getPopup() {
        const popup = await this.homeRepository.findPopUp();
        return popup || null;
    }

    // 실시간 스코어 조회
    async getLiveScore(dto: GetLiveScoreDto, user?: any) {
        const { category, date, limit = 5 } = dto;
        const user_id = user?.user_id || null;
        
        // 날짜 처리
        const searchDate = date || new Date().toISOString().split('T')[0];
        const startTime = searchDate.replace(/-/g, '') + '0000';
        const endTime = searchDate.replace(/-/g, '') + '2359';
        
        // 카테고리 조건 처리
        let categoryCondition = '';
        let categoryParams: string[] = [];
        
        if (category && category !== 'all') {
            categoryCondition = 'AND A.category = ?';
            categoryParams = [category];
        }

        return this.homeRepository.findLiveScore({
            user_id,
            startTime,
            endTime,
            categoryCondition,
            categoryParams,
            lslimit: limit
        });
    }

    // 전문가 분석 글 조회
    async getAnalyzePicks(dto: GetAnalyzePicksDto, user?: any) {
        const { category, date, limit = 4 } = dto;
        const user_id = user?.user_id || null;
        
        // 날짜 처리
        const searchDate = date || new Date().toISOString().split('T')[0];
        const startTime = searchDate.replace(/-/g, '') + '0000';
        const endTime = searchDate.replace(/-/g, '') + '2359';
        
        // 카테고리 조건 처리
        let categoryCondition = '';
        let categoryParams: string[] = [];
        
        if (category && category !== 'all') {
            categoryCondition = 'AND TD.category = ?';
            categoryParams = [category];
        }

        return this.homeRepository.findAnalyzePosts({
            user_id,
            startTime,
            endTime,
            categoryCondition,
            categoryParams,
            aplimit: limit
        });
    }

    // 뉴스 조회
    async getNews(dto: GetNewsDto) {
        const { category, limit = 10 } = dto;
        
        // 카테고리 조건 처리
        let categoryCondition = '';
        let categoryParams: string[] = [];
        
        if (category && category !== 'all') {
            categoryCondition = 'AND category = ?';
            categoryParams = [category];
        }

        return this.homeRepository.findNews({
            categoryCondition,
            categoryParams,
            newslimit: limit
        });
    }

    // 인기 게시글 TOP 10 조회
    async getPostTopTen(dto: GetPostTopTenDto) {
        const { limit = 10 } = dto;
        
        return this.homeRepository.findPostTopTen({
            postlimit: limit
        });
    }

    // 부상 정보 조회
    async getInjury(dto: GetInjuryDto, user?: any) {
        const { category, limit = 5 } = dto;
        const user_id = user?.user_id || null;
        
        // 카테고리 조건 처리
        let categoryCondition = '';
        let categoryParams: string[] = [];
        
        if (category && category !== 'all') {
            categoryCondition = 'AND A.injury_lineup_category = ?';
            categoryParams = [category];
        }

        return this.homeRepository.findInjury({
            user_id,
            categoryCondition,
            categoryParams,
            injurylimit: limit
        });
    }

    // 라인업 정보 조회
    async getLineup(dto: GetLineupDto, user?: any) {
        const { category, limit = 5 } = dto;
        const user_id = user?.user_id || null;
        
        // 카테고리 조건 처리
        let categoryCondition = '';
        let categoryParams: string[] = [];
        
        if (category && category !== 'all') {
            categoryCondition = 'AND A.injury_lineup_category = ?';
            categoryParams = [category];
        }

        return this.homeRepository.findLineup({
            user_id,
            categoryCondition,
            categoryParams,
            injurylimit: limit
        });
    }

    // 기존 통합 API (호환성을 위해 유지, 내부적으로는 병렬 처리)
    async getHome(getHomeDto: GetHomeDto, user?: any) {
        const { 
            category, 
            date, 
            ap_limit = 4, 
            ls_limit = 5, 
            news_limit = 10, 
            post_limit = 10, 
            injury_limit = 5, 
            lineup_limit = 5 
        } = getHomeDto;

        // 병렬 처리로 성능 개선
        const [popup, liveScore, analyzePicks, news, postTopTen, injury, lineup] = await Promise.all([
            this.getPopup(),
            this.getLiveScore({ category, date, limit: ls_limit }, user),
            this.getAnalyzePicks({ category, date, limit: ap_limit }, user),
            this.getNews({ category, limit: news_limit }),
            this.getPostTopTen({ limit: post_limit }),
            this.getInjury({ category, limit: injury_limit }, user),
            this.getLineup({ category, limit: lineup_limit }, user)
        ]);

        return {
            popup,
            live_score: liveScore,
            analyze_picks: analyzePicks,
            news,
            post_topten: postTopTen,
            injury,
            lineup
        };
    }

    async getSearchRolling() {
        
        const scheme = 'feedbag_search_stat';
        const search_popular = await this.searchRepository.findPopularSearch(scheme);

        return search_popular;

    }

    async getAnalyzeMatch(getAnalyzeMatchDto: GetAnalyzeMatchDto, user?: any) {
        const { category } = getAnalyzeMatchDto;
        const user_id = user?.user_id || null;

        // 카테고리 조건 처리
        let categoryCondition = '';
        let categoryParams: string[] = [];

        if (category && category !== 'all') {
            categoryCondition = 'AND TD.category = ?';
            categoryParams = [category];
        }

        // 분석 포스트 조회
        const selectedAnalyze = await this.homeRepository.findAnalyzeMatch({
            user_id,
            categoryCondition,
            categoryParams
        });

        if (selectedAnalyze.length === 0) {
            return { matches: [] };
        }

        // post_id와 match_id 추출
        const postIds = selectedAnalyze.map(item => item.post_id);
        const matchIds = selectedAnalyze.map(item => item.match_id).filter(Boolean);

        // 병렬로 스포츠 정보와 포스트 이미지 조회
        const [selectedSports] = await Promise.all([
            this.homeRepository.findSportsInfoByMatchIds(matchIds)
        ]);

        // 포스트 이미지 맵 생성
        // const postImgMap = postImg.reduce((acc, item) => {
        //     if (!acc[item.post_id]) acc[item.post_id] = [];
        //     acc[item.post_id].push({ id: item.id, url: item.img });
        //     return acc;
        // }, {});

        // 스포츠 정보 맵 생성 (match_id 기준)
        const sportsMap = new Map((selectedSports || []).map(s => [
            s.match_id, {
                timeinfo: s.timeinfo,
                sports_match_id: s.match_id,
                competition_name: s.competition_name,
                kor_competition_name: s.kor_competition_name,
                competition_logo: s.competition_logo,
                home_team_name: s.home_team_name,
                kor_home_team_name: s.kor_home_team_name,
                home_team_logo: s.home_team_logo,
                away_team_name: s.away_team_name,
                kor_away_team_name: s.kor_away_team_name,
                away_team_logo: s.away_team_logo
            }
        ]));

        // 유저 vs 유저 매칭 로직
        const groupedByMatch = new Map();

        for (const post of selectedAnalyze) {
            const matchId = post.match_id;
            if (!matchId) continue;

            if (!groupedByMatch.has(matchId)) {
                groupedByMatch.set(matchId, []);
            }
            groupedByMatch.get(matchId).push(post);
        }

        // 결과 구조: 각 경기별 페어
        const pairedMatches: any[] = [];

        for (const [matchId, posts] of groupedByMatch.entries()) {
            const sports = sportsMap.get(matchId) || null;

            // 3명 이상이면 최신 2명만 (created_at DESC 기준)
            const trimmedPosts = posts.slice(0, 2);

            // 정확히 2명일 때만 표시
            if (trimmedPosts.length === 2) {
                pairedMatches.push({
                    sports_match_id: matchId,
                    sports,
                    users: trimmedPosts.map(u => {
                        const { match_id, ...rest } = u; // match_id 제거
                        return {
                            ...rest,
                            // files: postImgMap[u.post_id] || []
                        };
                    })
                });
            }
        }

        // 상위 10개만 반환
        return { matches: pairedMatches.slice(0, 10) };
    }
}
