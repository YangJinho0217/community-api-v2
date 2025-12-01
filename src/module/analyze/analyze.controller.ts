import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyzeService } from './analyze.service';
import { GetAnalyzeDto } from './dto/getAnalyze.dto';
import { ApiResponse } from 'src/common/response.util';
import { OptionalJwtAuthGuard } from 'src/auth/jwt/optional-jwt-auth.guard';
import { GetAnalyzeDetailDto } from './dto/getAnalyzeDetail.dto';

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
}
