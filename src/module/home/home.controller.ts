import { Controller, Get, Post, Body, Param, Query, Res, Req, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { GetHomeDto } from './dto/getHome.dto';
import { OptionalJwtAuthGuard } from '../../auth/jwt/optional-jwt-auth.guard';
import { ApiResponse } from 'src/common/response.util';

@Controller('/api/v2/home')
export class HomeController {

    constructor(private readonly homeService: HomeService) {}

    @UseGuards(OptionalJwtAuthGuard)
    @Get("/auth/live_score")
    async getHome(@Query() getHomeDto: GetHomeDto, @Req() req) {
        const user = req.user; // 토큰이 있으면 user 객체, 없으면 null
        const data = await this.homeService.getHome(getHomeDto, user);
        return ApiResponse.success(data, "Get Live Score Success");
        
    }
}
