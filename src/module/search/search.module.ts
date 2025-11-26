import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchRpository } from './search.repository';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
    controllers : [ SearchController],
    providers : [SearchService, SearchRpository, JwtService, AuthService]
})
export class SearchModule {
}
