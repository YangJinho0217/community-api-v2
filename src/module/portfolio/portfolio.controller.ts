import { Controller, Get, Post, Body } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { VisitorDto } from './dto/visitor.dto';
import { ApiResponse } from 'src/common/response.util';

@Controller('/api/v3/portfolio')
export class PortfolioController {

    constructor (private readonly portfolioService : PortfolioService) {}


    @Post("/welcome")
    async welcomeVisitor(@Body() visitorDto : VisitorDto) {
        await this.portfolioService.visitorWelcome(visitorDto);
        return ApiResponse.message("Post VisitorWelcome Success");
    }



}
