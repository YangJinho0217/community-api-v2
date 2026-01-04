import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyzeService } from './analyze.service';
import { GetAnalyzeDto } from './dto/getAnalyze.dto';
import { ApiResponse } from 'src/common/response.util';
import { OptionalJwtAuthGuard } from 'src/auth/jwt/optional-jwt-auth.guard';
import { GetAnalyzeDetailDto } from './dto/getAnalyzeDetail.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { GetCompetitionInGenerateAnalyzePostDto } from './dto/getCompetitionInAnalyzePost.dto';
import { GetMatchInGenerateAnalyzePostDto } from './dto/getMatchInAnalyzePost.dto';
import { GenerateAnalyzePostDto } from './dto/generateAnalyePost.dto';

@Controller('/api/v2/analyze')
export class AnalyzeController {

    constructor (
        private readonly analyzeService : AnalyzeService
    ) {}
    
    @UseGuards(OptionalJwtAuthGuard)
    @Get("/")
    async getAnalyzePost(@Query() getAnalyzeDto: GetAnalyzeDto, @Req() req) {
        const user = req.user;
        const data = await this.analyzeService.getAnalyzePost(getAnalyzeDto, user);
        return ApiResponse.success(data, "Get Analyze Success");
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get("/detail")
    async getAnalyzePostDetail(@Query() getAnalyzePostDetailDto: GetAnalyzeDetailDto, @Req() req) {
        const user = req.user;
        const data = await this.analyzeService.getAnalyzePostDetail(getAnalyzePostDetailDto, user);
        return ApiResponse.success(data, "Get Analyze Detail Success");
    }

    
    @UseGuards(JwtAuthGuard)
    @Get("/generate/category")
    async getCategoryInGenerateAnalyzePost(@Req() req) {
        const user = req.user;
        const data = await this.analyzeService.getCategoryInGenerateAnalyzePost(user);
        return ApiResponse.success(data, "Get Generate Category Success");
    }

    @UseGuards(JwtAuthGuard)
    @Get("/generate/competition")
    async getCompetitionInGenerateAnalyzePost(@Query() getCompetitionInGenerateAnalyzePostDto : GetCompetitionInGenerateAnalyzePostDto, @Req() req) {
        const user = req.user;
        const data = await this.analyzeService.getCompetitionInGenerateAnalyzePost(getCompetitionInGenerateAnalyzePostDto, user);
        return ApiResponse.success(data, "Get Generate Competition Success");
    }

    @UseGuards(JwtAuthGuard)
    @Get("/generate/match")
    async getMatchInGenerateAnalyzePost(@Query() getMatchInGenerateAnalyzePostDto : GetMatchInGenerateAnalyzePostDto, @Req() req) {
        const user = req.user;
        const data = await this.analyzeService.getMatchInGenerateAnalyzePost(getMatchInGenerateAnalyzePostDto, user);
        return ApiResponse.success(data, "Get Generate Match Success");
    }

    @UseGuards(JwtAuthGuard)
    @Get("/generate")
    async generateAnalyzePost(@Query() generateAnalyzePost : GenerateAnalyzePostDto, @Req() req) {
        const user = req.user;
        const data = await this.analyzeService.generateAnalyzePost(generateAnalyzePost, user);
        return ApiResponse.success(data, "Post Generate Analyze Success");
    }
}
