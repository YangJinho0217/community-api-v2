import { Module } from '@nestjs/common';
import { HomeService } from './home.service';
import { HomeController } from './home.controller';
import { HomeRepository } from './home.repository';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';

@Module({
  controllers : [HomeController],
  providers: [HomeService, HomeRepository, JwtService, AuthService],
  exports : [HomeService]
})
export class HomeModule {}
