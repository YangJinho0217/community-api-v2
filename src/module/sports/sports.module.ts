import { Module } from '@nestjs/common';
import { SportsController } from './sports.controller';
import { SportsService } from './sports.service';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { SportsRepository } from './sports.repository';

@Module({
    controllers : [SportsController],
    providers : [SportsService, JwtService, AuthService, SportsRepository]
})
export class SportsModule {}
