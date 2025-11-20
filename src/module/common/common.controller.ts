import { Controller, Get, Post, Body, Param, Query, Res, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { CommonService } from './common.service';
import { LoginDto } from './dto/login.dto';
import { GetUuidDto } from './dto/getUuid.dto';
import { ApiResponse } from 'src/common/response.util';
import { GetNickNameDto } from './dto/getNickName.dto';
import { SendUserAuthCodeDto } from './dto/sendUserCode.dto';
import { AuthCodeDto } from './dto/authCode.dto';
import { GetReferrerDto } from './dto/getReferrer.dto';
import { SignUpDto } from './dto/signUp.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { GetUserUuidDto } from './dto/getUserUuid.dto';
import { GetUserPasswordDto } from './dto/getUserPassword.dto';
import { UpdateUserPasswordDto } from './dto/updateUserPassword.dto';

@Controller("/api/v2/common")
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Post("/auth/signIn")
  async tryLogin(@Body() loginDto : LoginDto, @Res({ passthrough: true }) response: Response) {
    const data = await this.commonService.tryLogin(loginDto, response);
    return ApiResponse.success(data, "SignIn Success");
  }

  @Get("/auth/check/uuid")
  async getUserUuid(@Query() getUuidDto : GetUuidDto) {
    const data = await this.commonService.getUuid(getUuidDto);
    if(data == 200) return ApiResponse.message("Get uuid Success");
  }

  @Get("/auth/check/nickName")
  async getNickName(@Query() getNickNameDto : GetNickNameDto) {
    const data = await this.commonService.getNickName(getNickNameDto);
    if(data == 200) return ApiResponse.message('Get NickName Success');
  }

  @Get("/auth/check/referrer")
  async getReferrer(@Query() getReferrerDto : GetReferrerDto) {
    const data = await this.commonService.getReferrer(getReferrerDto);
    if(data == 200) return ApiResponse.message('Get Referrer Success');
  }

  @Post("/auth/send_code")
  async sendAuthCode(@Body() sendUserAuthCodeDto : SendUserAuthCodeDto) {
    const data = await this.commonService.sendUserAuthCode(sendUserAuthCodeDto);
    // if(data == 200) return ApiResponse.message('Send Auth Code Success');
    return ApiResponse.success(data, "Send Auth Code Success");
  }

  @Post("/auth/authenticate_code")
  async authenticateCode(@Body() authCodeDto : AuthCodeDto) {
    const data = await this.commonService.checkUserAuthCode(authCodeDto);
    if(data == 200) return ApiResponse.message('Authenticated');
  }

  @Post("/auth/signUp")
  async trySignUp(@Body() signUpDto : SignUpDto) {
    const data = await this.commonService.trySignUp(signUpDto);
    if(data == 200) return ApiResponse.message('SignUp Success');
  }

  @Post("/auth/check/refresh_token/app")
  async getRefreshTokenApp(@Body() refreshTokenDto : RefreshTokenDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const data = await this.commonService.getRefreshToken(refreshTokenDto, request, response);
    return ApiResponse.success(data, "Refresh Token Authentication Success");
  }

  @Post("/auth/find/uuid")
  async getFindUserUuid(@Body() getUserUuidDto : GetUserUuidDto) {
    const data = await this.commonService.getUserUuid(getUserUuidDto);
    return ApiResponse.success(data, "Find User Uuid Success");
  }

  @Post("/auth/find/password")
  async getFindUserPassword(@Body() getUserPasswordDto : GetUserPasswordDto) {
    const data = await this.commonService.getUserPassword(getUserPasswordDto);
    return ApiResponse.message("Find User Password Success");
  }

  @Post("/auth/update/password")
  async updateUserPassword(@Body() updateUserPasswordDto : UpdateUserPasswordDto) {
    const data = await this.commonService.updateUserPassword(updateUserPasswordDto);
    return ApiResponse.message("Update User Password Success");
  }

}
