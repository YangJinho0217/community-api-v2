import { Controller, Req, UseGuards, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { OptionalJwtAuthGuard } from 'src/auth/jwt/optional-jwt-auth.guard';
import { ApiResponse } from 'src/common/response.util';
import { GetSearchDto } from './dto/getSearch.dto';

@Controller("/api/v2/search")
export class SearchController {

    constructor(
        private readonly searchService : SearchService

    ) {}

    // 검색 페이지 조회
    @UseGuards(OptionalJwtAuthGuard)
    @Get("/set")
    async getSearchSet(@Req() req) {
        const user = req.user;
        const data = await this.searchService.getSearchSet(user);
        return ApiResponse.success(data, "Get SearchSet Success");
    }

    // 검색 페이지 조회
    @UseGuards(OptionalJwtAuthGuard)
    @Get("/")
    async getSearch(@Query() getSearchDto : GetSearchDto, @Req() req) {
        const user = req.user;
        const data = await this.searchService.getSearch(getSearchDto, user);
        return ApiResponse.success(data, "Get Search Success");
    }
}
