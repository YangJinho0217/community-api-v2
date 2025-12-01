import { Injectable } from '@nestjs/common';
import { AnalyzeRepository } from './analyze.repository';
import { GetAnalyzeDto } from './dto/getAnalyze.dto';
import { GetAnalyzeDetailDto } from './dto/getAnalyzeDetail.dto';

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
}
