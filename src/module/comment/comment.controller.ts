import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiResponse } from 'src/common/response.util';
import { OptionalJwtAuthGuard } from 'src/auth/jwt/optional-jwt-auth.guard';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { CommentService } from './comment.service';
import { GetCommentDto } from './dto/getComment.dto';
import { GenerateCommentDto } from './dto/generateComment.dto';
import { GenerateReplyDto } from './dto/generateReply.dto';

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

    // generate_comment 는 반드시 로그인 필요
    @UseGuards(JwtAuthGuard)
    @Post("/generate_comment")
    async generateComment(@Body() generateCommentDto: GenerateCommentDto, @Req() req) {
        const user = req.user;
        const data = await this.commentService.generateComment(generateCommentDto, user);
        return ApiResponse.success(data, "Post Generate Comment Success");
    }

    // generate_comment 는 반드시 로그인 필요
    @UseGuards(JwtAuthGuard)
    @Post("/generate_reply")
    async generateReply(@Body() generateReplyDto: GenerateReplyDto, @Req() req) {
        const user = req.user;
        const data = await this.commentService.generateReply(generateReplyDto, user);
        return ApiResponse.success(data, "Post Generate Reply Success");
    }
}
