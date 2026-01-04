import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { CommentRepository } from './comment.repository';

@Module({
    controllers : [CommentController],
    providers : [CommentService, JwtService, AuthService, CommentRepository]
})
export class CommentModule {}
