import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { CommonService } from './common.service';
import { LoginDto } from './dto/login.dto';
import { getUuidDto } from './dto/getUuid.dto';
import { ApiResponse } from 'src/common/response.util';
import { getNickNameDto } from './dto/getNickName.dto';
import { sendUserAuthCodeDto } from './dto/sendUserCode.dto';
import { authCodeDto } from './dto/authCode.dto';
import { getReferrerDto } from './dto/getReferrer.dto';
import { SignUpDto } from './dto/signUp.dto';

@Controller("/api/v1/common")
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Post("/auth/signIn")
  async tryLogin(@Body() loginDto : LoginDto) {
    const data = await this.commonService.tryLogin(loginDto);
    return ApiResponse.success(data, "SignIn Success");
  }

  @Get("/auth/check/uuid")
  async getUserUuid(@Query() getUuidDto : getUuidDto) {
    const data = await this.commonService.getUuid(getUuidDto);
    if(data == 200) return ApiResponse.message("Get uuid Success");
  }

  @Get("/auth/check/nickName")
  async getNickName(@Query() getNickNameDto : getNickNameDto) {
    const data = await this.commonService.getNickName(getNickNameDto);
    if(data == 200) return ApiResponse.message('Get NickName Success');
  }

  @Get("/auth/check/referrer")
  async getReferrer(@Query() getReferrerDto : getReferrerDto) {
    const data = await this.commonService.getReferrer(getReferrerDto);
    if(data == 200) return ApiResponse.message('Get Referrer Success');
  }

  @Post("/auth/send_code")
  async sendAuthCode(@Body() sendUserAuthCodeDto : sendUserAuthCodeDto) {
    const data = await this.commonService.sendUserAuthCode(sendUserAuthCodeDto);
    // if(data == 200) return ApiResponse.message('Send Auth Code Success');
    return ApiResponse.success(data, "Send Auth Code Success");
  }

  @Post("/auth/authenticate_code")
  async authenticateCode(@Body() authCodeDto : authCodeDto) {
    const data = await this.commonService.checkUserAuthCode(authCodeDto);
    if(data == 200) return ApiResponse.message('Authenticated');
  }

  @Post("/auth/signUp")
  async trySignUp(@Body() SignUpDto : SignUpDto) {
    const data = await this.commonService.trySignUp(SignUpDto);
    if(data == 200) return ApiResponse.message('SignUp Success');
  }


}
