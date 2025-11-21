import { Controller, Get, Post, Body, Param, Query, Res, Req, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { GetHomeDto } from './dto/getHome.dto';
import { GetLiveScoreDto } from './dto/getLiveScore.dto';
import { GetAnalyzePicksDto } from './dto/getAnalyzePicks.dto';
import { GetNewsDto } from './dto/getNews.dto';
import { GetPostTopTenDto } from './dto/getPostTopTen.dto';
import { GetInjuryDto } from './dto/getInjury.dto';
import { GetLineupDto } from './dto/getLineup.dto';
import { OptionalJwtAuthGuard } from '../../auth/jwt/optional-jwt-auth.guard';
import { ApiResponse } from 'src/common/response.util';

@Controller('/api/v2/home')
export class HomeController {

    constructor(private readonly homeService: HomeService) {}

    // 팝업 조회
    @Get("/popup")
    async getPopup() {
        const data = await this.homeService.getPopup();
        return ApiResponse.success(data, "Get Popup Success");
    }

    // 실시간 스코어 조회
    @UseGuards(OptionalJwtAuthGuard)
    @Get("/live-score")
    async getLiveScore(@Query() getLiveScoreDto: GetLiveScoreDto, @Req() req) {
        const user = req.user;
        const data = await this.homeService.getLiveScore(getLiveScoreDto, user);
        return ApiResponse.success(data, "Get Live Score Success");
    }

    // 전문가 분석 글 조회
    @UseGuards(OptionalJwtAuthGuard)
    @Get("/analyze-picks")
    async getAnalyzePicks(@Query() getAnalyzePicksDto: GetAnalyzePicksDto, @Req() req) {
        const user = req.user;
        const data = await this.homeService.getAnalyzePicks(getAnalyzePicksDto, user);
        return ApiResponse.success(data, "Get Analyze Picks Success");
    }

    // 뉴스 조회
    @Get("/news")
    async getNews(@Query() getNewsDto: GetNewsDto) {
        const data = await this.homeService.getNews(getNewsDto);
        return ApiResponse.success(data, "Get News Success");
    }

    // 인기 게시글 TOP 10 조회
    @Get("/post-top-ten")
    async getPostTopTen(@Query() getPostTopTenDto: GetPostTopTenDto) {
        const data = await this.homeService.getPostTopTen(getPostTopTenDto);
        return ApiResponse.success(data, "Get Post Top Ten Success");
    }

    // 부상 정보 조회
    @UseGuards(OptionalJwtAuthGuard)
    @Get("/injury")
    async getInjury(@Query() getInjuryDto: GetInjuryDto, @Req() req) {
        const user = req.user;
        const data = await this.homeService.getInjury(getInjuryDto, user);
        return ApiResponse.success(data, "Get Injury Success");
    }

    // 라인업 정보 조회
    @UseGuards(OptionalJwtAuthGuard)
    @Get("/lineup")
    async getLineup(@Query() getLineupDto: GetLineupDto, @Req() req) {
        const user = req.user;
        const data = await this.homeService.getLineup(getLineupDto, user);
        return ApiResponse.success(data, "Get Lineup Success");
    }

    // 기존 통합 API (호환성을 위해 유지)
    @UseGuards(OptionalJwtAuthGuard)
    @Get("/auth/live_score")
    async getHome(@Query() getHomeDto: GetHomeDto, @Req() req) {
        const user = req.user; // 토큰이 있으면 user 객체, 없으면 null
        const data = await this.homeService.getHome(getHomeDto, user);
        return ApiResponse.success(data, "Get Home Success");
    }
}
