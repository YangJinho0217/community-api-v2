import { Controller, Get, Post, Body, Param, Query, Res, Req, UseGuards } from '@nestjs/common';
import { SportsService } from './sports.service';
import { GetSportsDto } from './dto/getSports.dto';
import { OptionalJwtAuthGuard } from 'src/auth/jwt/optional-jwt-auth.guard';
import { ApiResponse } from 'src/common/response.util';
import { GetSportsDetailDto } from './dto/getSportsDetail.dto';

@Controller('api/v2/sports')
export class SportsController {

    constructor ( 
        private readonly sportsService : SportsService
    ) {}

    // 팝업 조회
    @UseGuards(OptionalJwtAuthGuard)
    @Get("/")
    async getSports(@Query() getSportsDto : GetSportsDto, @Req() req) {
        const user = req.user;
        const data = await this.sportsService.getSports(getSportsDto, user);
        return ApiResponse.success(data, "Get Sports Success");
    }

    // 팝업 조회
    @UseGuards(OptionalJwtAuthGuard)
    @Get("/detail")
    async getSportsDtail(@Query() getSPortsDetailDto : GetSportsDetailDto, @Req() req) {
        const user = req.user;
        const data = await this.sportsService.getSportsDetail(getSPortsDetailDto, user);
        return ApiResponse.success(data, "Get SportsDetail Success");
    }

    // @Get("/category")
    // async getSportsDtail(@Query() getSPortsDetailDto : GetSportsDetailDto, @Req() req) {
    //     const user = req.user;
    //     const data = await this.sportsService.getSportsDetail(getSPortsDetailDto, user);
    //     return ApiResponse.success(data, "Get SportsDetail Success");
    // }
}
