import { Injectable } from '@nestjs/common';
import { GetSportsDto } from './dto/getSports.dto';
import { SportsRepository } from './sports.repository';

@Injectable()
export class SportsService {

    constructor (
        private readonly sportsRepository : SportsRepository
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

        const findDailySports = await this.sportsRepository.findDailySports(
            user_id, queryStartDate, queryEndDate, category, filter, page_no, limit
        )



        
    }
}
