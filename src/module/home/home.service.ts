import { Injectable } from '@nestjs/common';
import { HomeRepository } from './home.repository';
import { GetHomeDto } from './dto/getHome.dto';
import { GetLiveScoreDto } from './dto/getLiveScore.dto';
import { GetAnalyzePicksDto } from './dto/getAnalyzePicks.dto';
import { GetNewsDto } from './dto/getNews.dto';
import { GetPostTopTenDto } from './dto/getPostTopTen.dto';
import { GetInjuryDto } from './dto/getInjury.dto';
import { GetLineupDto } from './dto/getLineup.dto';
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
}
