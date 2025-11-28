import { ForbiddenException, Injectable } from '@nestjs/common';
import { SearchRpository } from './search.repository';
import { ConfigService } from '@nestjs/config';
import { GetSearchDto } from './dto/getSearch.dto';

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

    async getSearch(getSearchDto : GetSearchDto, user? : any) {

        const user_id = user?.user_id || null;
        const search = getSearchDto.search;
        const search_type = getSearchDto.search_type;
        const search_sub_type = getSearchDto.search_sub_type;
        const filter = getSearchDto.filter;

        // 금지 검색어 차단
        const findForbiddenSearch = await this.searchRepository.findForbiddenSearch(search);

        if(findForbiddenSearch.length > 0) {
            throw new ForbiddenException('forbidden_search');
        }

        // 검색 카운트 UP & 유저별 검색목록 저장 Query
        await this.searchRepository.createSearchTransaction(user_id, search);

        // search_type에 따른 분기 처리
        switch(search_type) {
            case 'all':
                return await this.getSearchAll(getSearchDto, user);
            case 'sports':
                return await this.getSearchSports(getSearchDto, user);
            case 'com':
                return await this.getSearchCommunity(getSearchDto, user);
            case 'news':
                return await this.getSearchNews(getSearchDto, user);
            case 'user':
                return await this.getSearchUser(getSearchDto, user);
            default:
                return await this.getSearchAll(getSearchDto, user);
        }
    }

    async getSearchAll(getSearchDto : GetSearchDto, user? : any) {

        const user_id = user?.user_id || null;
        const search = getSearchDto.search;

        //dailymatch
        const sports = await this.searchRepository.findSportsDailyMatch(search, user_id);

        // community posts
        const community = await this.searchRepository.findCommunityPost(search, user_id);

        // analyze posts
        const analyze = await this.searchRepository.findAnalyzePost(search, user_id);
        
        // news
        const news = await this.searchRepository.findNews(search);

        const users = await this.searchRepository.findUser(search, user_id);

        const result = {
            sports : sports,
            community : community,
            analyze : analyze,
            news : news,
            users : users
        }

        return result;

    }

    async getSearchSports(getSearchDto : GetSearchDto, user? : any) {

        const user_id = user?.user_id || null;
        const search = getSearchDto.search;
        const page_no = getSearchDto.page_no || 1;
        const limit = getSearchDto.limit || 10;

        //dailymatch
        const totalMatch = await this.searchRepository.findSportsDailyMatchInSportsTotal(search, user_id);
        // const matches = await this.searchRepository.findSportsDailyMatchInSports(search, user_id, page_no, limit);
        console.log(totalMatch);
        return;
        // const result = {
        //     total_count : totalMatch[0].count,
        //     total_page : Math.ceil(totalMatch[0].count / limit),
        //     match : matches
        // }

        // return result;

    }

    async getSearchCommunity(getSearchDto : GetSearchDto, user? : any) {
        const user_id = user?.user_id || null;
        const search = getSearchDto.search;
        const page_no = getSearchDto.page_no || 1;
        const limit = getSearchDto.limit || 10;
        const search_sub_type = getSearchDto.search_sub_type || '';
        const filter = getSearchDto.filter || '';

        const totalCommunity = await this.searchRepository.findCommunityPostInComTotal(search, user_id, search_sub_type, filter);
        const community = await this.searchRepository.findCommunityPostInCom(search, user_id, page_no, limit, search_sub_type, filter);
        
        const result = {
            total_count : totalCommunity[0].count,
            total_page : Math.ceil(totalCommunity[0].count / limit),
            community : community
        }

        return result;
    }

    async getSearchNews(getSearchDto : GetSearchDto, user? : any) {
        const user_id = user?.user_id || null;
        const search = getSearchDto.search;
        const page_no = getSearchDto.page_no || 1;
        const limit = getSearchDto.limit || 10;

        // TODO: 뉴스 검색 로직 구현 예정
        const totalNews = await this.searchRepository.findNewsTabTotal(search);
        const news = await this.searchRepository.findNewsTab(search, page_no, limit);
        
        const result = {
            total_count : totalNews[0].count,
            total_page : Math.ceil(totalNews[0].count / limit),
            news : news
        }

        return result;
    }

    async getSearchUser(getSearchDto : GetSearchDto, user? : any) {
        const user_id = user?.user_id || null;
        const search = getSearchDto.search;
        const page_no = getSearchDto.page_no || 1;
        const limit = getSearchDto.limit || 10;

        // TODO: 사용자 검색 로직 구현 예정
        // const users = await this.searchRepository.getSearchUser(search, user_id, page_no, limit);
        return null;
        // return { users };
    }


}
