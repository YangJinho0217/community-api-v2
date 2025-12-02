import { Injectable } from '@nestjs/common';
import { CommentRepository } from './comment.repository';
import { GetCommentDto } from './dto/getComment.dto';

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
}
