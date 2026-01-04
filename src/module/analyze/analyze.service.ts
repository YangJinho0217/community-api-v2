import { ForbiddenException, Injectable } from '@nestjs/common';
import { AnalyzeRepository } from './analyze.repository';
import { GetAnalyzeDto } from './dto/getAnalyze.dto';
import { GetAnalyzeDetailDto } from './dto/getAnalyzeDetail.dto';
import { GetCompetitionInGenerateAnalyzePostDto } from './dto/getCompetitionInAnalyzePost.dto';
import { toDateRangeFromYMD } from 'src/common/date.util';
import { GetMatchInGenerateAnalyzePostDto } from './dto/getMatchInAnalyzePost.dto';
import { GenerateAnalyzePostDto } from './dto/generateAnalyePost.dto';

@Injectable()
export class AnalyzeService {

    constructor (
        private readonly analyzeRepository : AnalyzeRepository
    ) {}

    async getAnalyzePost(getAnalyzeDto : GetAnalyzeDto, user?: any) {

        const user_id = user?.user_id || null;
        const category = getAnalyzeDto.category || '';
        const feed_filter = getAnalyzeDto.feed_filter || '';
        const page_no = getAnalyzeDto.page_no || 1;
        const limit = getAnalyzeDto.limit || 10;

        // 카테고리 조건 처리
        let categoryCondition = '';
        let categoryParams: string[] = [];
        
        if (category && category !== 'all') {
            categoryCondition = 'AND TD.category = ?';
            categoryParams = [category];
        }

        let filterCondition = '';
        let filterParams : string[] = [];

        if(feed_filter && feed_filter !== 'public') {
            filterCondition = 'AND A.allowable_range = ?';
            filterParams = ['following'];
        }

        const analyzeTotal = await this.analyzeRepository.findAnalyzePostTotal(categoryCondition, categoryParams, filterCondition, filterParams, user_id);
        const analyze_post = await this.analyzeRepository.findAnalyzePost(
            categoryCondition, categoryParams, filterCondition, filterParams, user_id, page_no, limit
        );

        const result = {
            total_count : analyzeTotal[0].count,
            total_page : Math.ceil(analyzeTotal[0].count / limit),
            post : analyze_post
        }

        return result;
    }

    async getAnalyzePostDetail(getAnalyzeDetailDto : GetAnalyzeDetailDto, user? : any) {

        const user_id = user?.user_id || null;
        const post_id = getAnalyzeDetailDto.post_id || 0;

        const post = await this.analyzeRepository.findAnalyzePostDetail(post_id, user_id);
        const comment_list = await this.analyzeRepository.findComment(post_id, user_id);
        
        return {
            ...post,
            comment_list
        };
    }

    async getCategoryInGenerateAnalyzePost(user? : any) {

        const user_id = user?.user_id || null;
        const findUserLevel = await this.analyzeRepository.findUserLevel(user_id);
        const user_level = Number(findUserLevel.user_level);

        if(user_level < 3) {
            throw new ForbiddenException('access_permission_denied');
        }

        const findCategoryInGenerateAnalyzePost = await this.analyzeRepository.findCategoryInGenerateAnalyzePost();

        return findCategoryInGenerateAnalyzePost;
        
    }

    async getCompetitionInGenerateAnalyzePost(getCompetitionInGenerateAnalyzePostDto : GetCompetitionInGenerateAnalyzePostDto, user? : any) {

        const user_id = user?.user_id || null;
        const category = getCompetitionInGenerateAnalyzePostDto.category || '';
        const date = getCompetitionInGenerateAnalyzePostDto.date || '';

        const findUserLevel = await this.analyzeRepository.findUserLevel(user_id);
        const user_level = Number(findUserLevel.user_level);

        if(user_level < 3) {
            throw new ForbiddenException('access_permission_denied');
        }

        // 날짜 변환: 'YYYY-MM-DD' -> 'YYYYMMDD0000' / 'YYYYMMDD2359'
        const range = toDateRangeFromYMD(date);
        const queryStartDate = range?.start || '';
        const queryEndDate = range?.end || '';

        let dateCondition = '';
        let dateParams : string[] = [];
        if(queryStartDate && queryEndDate) {
            dateCondition = 'AND A.matchtime >= ? AND A.matchtime <= ?';
            dateParams = [queryStartDate, queryEndDate];
        }

        let categoryCondition = '';
        let categoryParams : string[] = [];

        if(category) {
            categoryCondition = 'WHERE A.category = ?';
            categoryParams = [category];
        }

        // TODO: repository 호출 시 queryStartDate, queryEndDate 사용
        const result = await this.analyzeRepository.findCompetitionInGenerateAnalyzePost(categoryCondition, categoryParams, dateCondition, dateParams);
        return result;
    }

    async getMatchInGenerateAnalyzePost(getMatchInGenerateAnalyzePostDto : GetMatchInGenerateAnalyzePostDto, user? : any) {

        const user_id = user?.user_id || null;
        const category = getMatchInGenerateAnalyzePostDto.category || '';
        const date = getMatchInGenerateAnalyzePostDto.date || '';
        const competition_id = getMatchInGenerateAnalyzePostDto.competition_id || '';

        const findUserLevel = await this.analyzeRepository.findUserLevel(user_id);
        const user_level = Number(findUserLevel.user_level);

        if(user_level < 3) {
            throw new ForbiddenException('access_permission_denied');
        }

        // 날짜 변환: 'YYYY-MM-DD' -> 'YYYYMMDD0000' / 'YYYYMMDD2359'
        const range = toDateRangeFromYMD(date);
        const queryStartDate = range?.start || '';
        const queryEndDate = range?.end || '';

        let dateCondition = '';
        let dateParams : string[] = [];
        if(queryStartDate && queryEndDate) {
            dateCondition = 'AND A.matchtime >= ? AND A.matchtime <= ?';
            dateParams = [queryStartDate, queryEndDate];
        }

        let categoryCondition = '';
        let categoryParams : string[] = [];

        if(category) {
            categoryCondition = 'WHERE A.category = ?';
            categoryParams = [category];
        }

        const result = await this.analyzeRepository.findMatchInGenerateAnalyzePost(categoryCondition, categoryParams, dateCondition, dateParams, competition_id);
        return result;
    }

    // 분석글 최종 작성
    async generateAnalyzePost(generateAnalyzePost : GenerateAnalyzePostDto, user? : any) {


    }
}
