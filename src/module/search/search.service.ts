import { Injectable } from '@nestjs/common';
import { SearchRpository } from './search.repository';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SearchService {

    constructor ( 
        private readonly searchRepository : SearchRpository,
        private readonly configService : ConfigService
    ) {}

    async getSearchSet(user? : any) {

        const user_id = user?.user_id || null;
        const scheme = 'feedbag_search_stat';
        
        // 방법 1: 삼항 연산자를 사용한 간단한 할당
        const findUserCurrentSearch = user_id ? await this.searchRepository.findUserCurrentSearch(user_id) : null;

        const findPopularSearch = await this.searchRepository.findPopularSearch(scheme);

        const result = {
            current_search : findUserCurrentSearch,
            popular_search : findPopularSearch
        };

        return result;
        
    }
}
