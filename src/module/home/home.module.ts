import { Module } from '@nestjs/common';
import { HomeService } from './home.service';
import { HomeController } from './home.controller';
import { HomeRepository } from './home.repository';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { SearchRpository } from '../search/search.repository';

@Module({
  controllers : [HomeController],
  providers: [HomeService, HomeRepository, JwtService, AuthService, SearchRpository],
  exports : [HomeService]
})
export class HomeModule {}
