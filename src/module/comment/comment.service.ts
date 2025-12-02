import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CommentRepository } from './comment.repository';
import { GetCommentDto } from './dto/getComment.dto';
import { GenerateCommentDto } from './dto/generateComment.dto';
import { GenerateReplyDto } from './dto/generateReply.dto';

@Injectable()
export class CommentService {


    constructor (
        private readonly commentRepository : CommentRepository
    ) {};

    async getComment(getCommentDto : GetCommentDto, user? : any) {

        const user_id = user?.user_id || null;
        const post_id = getCommentDto.post_id || 0;
        const page_no = getCommentDto.page_no || 1;
        const limit = getCommentDto.limit || 10;
        const filter = getCommentDto.filter || null;

        let filterCondition = '';

        if(filter && filter === 'new') {
            filterCondition = 'ORDER BY C.created_at DESC';
        }

        if(filter && filter === 'old') {
            filterCondition = 'ORDER BY C.created_at ASC';
        }

        const commentTotal = await this.commentRepository.findCommentTotal(post_id, user_id);
        const comment = await this.commentRepository.findComment(post_id, user_id, filterCondition, page_no, limit);
        
        const result = {
            total_count : commentTotal[0].count,
            total_page : Math.ceil(commentTotal[0].count / limit),
            comment : comment
        }

        return result;
    }

    async generateComment(generateCommentDto : GenerateCommentDto, user? : any) {

        const user_id = user?.user_id || null;
        const post_id = generateCommentDto.post_id;
        const content = generateCommentDto.content;

        const generate_comment = await this.commentRepository.generateComment(post_id, user_id, content);

        if(generate_comment === 404) {
            throw new NotFoundException('not_found_post');
        }

    }

    async generateReply(generateReplyDto : GenerateReplyDto, user? : any) {

        const user_id = user?.user_id || null;
        const post_id = generateReplyDto.post_id;
        const comment_id = generateReplyDto.comment_id;
        const content = generateReplyDto.content;

        const generate_reply = await this.commentRepository.generateReply(post_id, comment_id, user_id, content);

        if (typeof generate_reply === 'object' && generate_reply !== null && 'type' in generate_reply) {
            if(generate_reply.type === 'post') {
                throw new NotFoundException('not_found_post');
            }
            if(generate_reply.type === 'comment') {
                throw new NotFoundException('not_found_comment');
            }
        }

    }
}
