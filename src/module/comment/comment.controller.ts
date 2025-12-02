import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiResponse } from 'src/common/response.util';
import { OptionalJwtAuthGuard } from 'src/auth/jwt/optional-jwt-auth.guard';
import { CommentService } from './comment.service';
import { GetCommentDto } from './dto/getComment.dto';

@Controller('/api/v2/comment')
export class CommentController {

    constructor (
        private readonly commentService : CommentService
    ) {}
    
    @UseGuards(OptionalJwtAuthGuard)
    @Get("/")
    async getComment(@Query() getCommentDto: GetCommentDto, @Req() req) {
        const user = req.user;
        const data = await this.commentService.getComment(getCommentDto, user);
        return ApiResponse.success(data, "Get CommentList Success");
    }

    // @UseGuards(OptionalJwtAuthGuard)
    // @Get("/detail")
    // async getAnalyzePostDetail(@Query() getAnalyzePostDetailDto: GetAnalyzeDetailDto, @Req() req) {
    //     const user = req.user;
    //     const data = await this.analyzeService.getAnalyzePostDetail(getAnalyzePostDetailDto, user);
    //     return ApiResponse.success(data, "Get Analyze Detail Success");
    // }
}
