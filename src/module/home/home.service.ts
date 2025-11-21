import { Injectable } from '@nestjs/common';
import { HomeRepository } from './home.repository';
import { GetHomeDto } from './dto/getHome.dto';

@Injectable()
export class HomeService {

    constructor (
        readonly homeRepository : HomeRepository 
    ) {}

    async getHome(getHomeDto: GetHomeDto, user?: any) {
        const data: any = {};
        const category = getHomeDto.category;
        const date = getHomeDto.date;
        const aplimit = getHomeDto.ap_limit;
        const lslimit = getHomeDto.ls_limit;
        
        // 날짜 처리 (비즈니스 로직)
        const searchDate = date || new Date().toISOString().split('T')[0];
        const startTime = searchDate.replace(/-/g, '') + '0000';
        const endTime = searchDate.replace(/-/g, '') + '2359';
        
        // 카테고리 조건 처리 (비즈니스 로직)
        let categoryCondition = '';
        let categoryParams: string[] = [];
        
        if (category && category !== 'all') {
            categoryCondition = 'AND TD.category = ?';
            categoryParams = [category];
        }

        const user_id = user?.user_id || null;

        // 1. 팝업 조회
        const popup = await this.homeRepository.findPopUp();
        data.popup = popup || null;

        // 2. 실시간 스코어 조회
        const live_score = await this.homeRepository.findLiveScore({
            user_id,
            startTime,
            endTime,
            categoryCondition,
            categoryParams,
            lslimit
        })

        data.live_score = live_score;

        // 3. 전문가 분석 글 조회
        const analyzePosts = await this.homeRepository.findAnalyzePosts({
            user_id,
            startTime,
            endTime,
            categoryCondition,
            categoryParams,
            aplimit
        });
        
        data.analyze_picks = analyzePosts;

        return data;
    }
}
