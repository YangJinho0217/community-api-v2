import { Module } from '@nestjs/common';
import { AnalyzeController } from './analyze.controller';
import { AnalyzeService } from './analyze.service';
import { AnalyzeRepository } from './analyze.repository';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';

@Module({
    controllers : [AnalyzeController],
    providers : [AnalyzeService, AnalyzeRepository, JwtService, AuthService]
})
export class AnalyzeModule {}
