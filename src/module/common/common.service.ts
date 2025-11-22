import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import type { Response, Request } from 'express';
import { CommonRepository } from './common.repository';
import { HashService } from 'src/common/hash.service';
import { AuthService } from 'src/auth/auth.service';

// Util
import { createAuthCodeWithLength } from 'src/common/authCode.util';

// DTO
import { LoginDto } from './dto/login.dto';
import { GetUuidDto } from './dto/getUuid.dto';
import { GetNickNameDto } from './dto/getNickName.dto';
import { SendUserAuthCodeDto } from './dto/sendUserCode.dto';
import { AuthCodeDto } from './dto/authCode.dto';
import { GetReferrerDto } from './dto/getReferrer.dto';
import { SignUpDto } from './dto/signUp.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { GetUserUuidDto } from './dto/getUserUuid.dto';
import { GetUserPasswordDto } from './dto/getUserPassword.dto';
import { UpdateUserPasswordDto } from './dto/updateUserPassword.dto';

@Injectable()
export class CommonService {

  constructor(
    private readonly commonRepository: CommonRepository,
    private readonly hashService: HashService,
    private readonly authService: AuthService
  ) { }

  async getFindAll() {
    return this.commonRepository.findAll();
  }

  async trySignUp(signupDto: SignUpDto) {

    let parameter = {
      type : 'basic',
      user_level : '01',
      user_status : 0,
      insignia_id : 1,
      insignia_level : '00',
      referrer_id: null as number | null,
      password: '' as string,
      password_hash_key: '' as string,
    };

    /**
     * * 유효성 검사 실시
    */ 
    // 유저 uuid 검사
    if(signupDto.uuid) {
      const uuidRegex = /^(?=.*[a-z])(?=.*\d)[a-z\d]{5,20}$/;
      if (!uuidRegex.test(signupDto.uuid)) {
        throw new ForbiddenException('invalid_uuid');
      }
    }

    if(signupDto.user_name) {
      const userNameRegex = /^[가-힣a-zA-Z]{2,100}$/;
      if(!userNameRegex.test(signupDto.user_name)) {
        throw new ForbiddenException('invalid_user_name');
      }
    }

    // 유저 닉네임 검사
    if(signupDto.nick_name) {
      const nameRegex = /^[가-힣a-zA-Z0-9]{2,10}$/;
      if (!nameRegex.test(signupDto.nick_name)) {
        throw new ForbiddenException('invalid_nick_name');
      }
    }

    if(signupDto.password) {
        // 비밀번호 유효성 검사: 영문 + 숫자 + 특수문자 포함, 8자 이상
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*+])[A-Za-z\d!@#$%^&*+]{8,}$/;
        if (!passwordRegex.test(signupDto.password)) {
          throw new ForbiddenException('invalid_password');
        }
    }

    if(signupDto.phone) {
      const phoneRegex = /^01[0-9][0-9]{3,4}[0-9]{4}$/;
      if (!phoneRegex.test(signupDto.phone)) {
        throw new ForbiddenException('invalid_phone');
      }
    }

    if(signupDto.referrer) {
      const uuidRegex = /^(?=.*[a-z])(?=.*\d)[a-z\d]{5,20}$/;
      if (!uuidRegex.test(signupDto.referrer)) {
        throw new ForbiddenException('invalid_referrer');
      }
    }

    /**
     * * 중복 검사 실시
    */ 
    // 유저 uuid 중복 검사 실행
    const already_user = await this.commonRepository.findUserUuid(signupDto.uuid);
    if (already_user) {
      throw new ConflictException('uuid_already_exists');
    }

    const already_nickname = await this.commonRepository.findNickName(signupDto.nick_name);
    if(already_nickname) {
      throw new ConflictException('nick_name_already_exists');
    } 

    const already_phone = await this.commonRepository.findUserPhone(signupDto.phone);
    if(already_phone) {
      throw new ConflictException('phone_already_exists');
    }

    /** 
     * * 미존재 검사 실시
     */
    if(signupDto.referrer) {
      const notfound_referrer = await this.commonRepository.findUserUuid(signupDto.referrer);
      if(!notfound_referrer) {
        throw new NotFoundException('not_found_referrer');
      }

      parameter.referrer_id = notfound_referrer.id;
      
    }

    const password = this.hashService.hashPasswordWithNewSalt(signupDto.password);

    if(password) {
      parameter.password = password.hashedPassword;
      parameter.password_hash_key = password.salt;
    }

    await this.commonRepository.insertSignUp(signupDto, parameter);

    return 200;

  }

  async tryLogin(loginDto: LoginDto, response?: Response) {

    const user = await this.commonRepository.findUserOne(loginDto.uuid);

    if (user.length < 1) {
      throw new NotFoundException('not_found_user');
    }

    if (user[0].user_status == 1) {
      throw new ForbiddenException('user_account_hold');
    }

    /**
     * * 비밀번호 검증
     */
    const isValid = this.hashService.validatePassword(
      loginDto.password,
      user[0].password_hash_key,       // db_hash_key
      user[0].password,       // db_password
    );

    if (!isValid) {
      throw new ForbiddenException('invalid_password');
    }

    /**
     * * 유저 팔로워 Count 
     */
    const user_follower = await this.commonRepository.findUserFollower(user[0].id);
    user[0].follower = user_follower.count;

    /**
     * * 유저 팔로잉 Count 
     */
    const user_following = await this.commonRepository.findUserFollowing(user[0].id);
    user[0].following = user_following.count;

    const access_token = this.authService.createAccessToken({
      user_id: user[0].id,
      uuid: user[0].uuid,
      user_name: user[0].user_name,
      nick_name: user[0].nick_name,
      user_status: user[0].user_status,
      is_deleted: user[0].is_deleted,
      type: 'access'
    })

    user[0].access_token = access_token;

    const refresh_token = this.authService.createRefreshToken({
      user_id: user[0].id,
      uuid: user[0].uuid,
      user_name: user[0].user_name,
      nick_name: user[0].nick_name,
      user_status: user[0].user_status,
      is_deleted: user[0].is_deleted,
      type: 'refresh'
    })

    user[0].refresh_token = refresh_token;

    const session_parameter = {
      user_id: user[0].id,
      session: access_token,
      refresh_session: refresh_token,
      device_type: loginDto.device_type,
      device_os: loginDto.device_os || null,
      fcm_token: loginDto.fcm_token || null
    }

    // 트랜잭션으로 FCM 토큰 업데이트와 세션 삽입을 함께 처리
    await this.commonRepository.updateFcmTokenAndInsertSession(session_parameter);

    const result_user = {
      user_id: user[0].id,
      uuid: user[0].uuid,
      user_type: user[0].user_type,
      user_name: user[0].user_name,
      insignia_img: user[0].insignia_img,
      phone: user[0].phone,
      nick_name: user[0].nick_name,
      user_level: user[0].user_level,
      level_name: user[0].level_name,
      user_status: user[0].user_status,
      point: user[0].point,
      img: user[0].img,
      user_exp: user[0].user_exp,
      follower: user[0].follower,
      following: user[0].following,
      authorization: session_parameter.session,
      refesh_authorization: session_parameter.refresh_session,
      noti_count: user[0].noti_count
    }
    
    if (loginDto.device_type === 'pc' && response) {
      // console.log('🍪 PC 클라이언트 - 쿠키 설정 시작');
      response.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // strict에서 lax로 변경 (테스트 환경에서 더 관대함)
        maxAge: 60 * 60 * 1000 // 1시간
      });
      
      response.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // strict에서 lax로 변경
        maxAge: 24 * 60 * 60 * 1000 // 24시간
      });

      // PC 클라이언트용 응답에서는 토큰 정보 제거 (보안상 이유)
      result_user.authorization = '';
      result_user.refesh_authorization = '';
      // console.log('✅ PC 클라이언트 - 쿠키 설정 및 토큰 제거 완료');
    }

    return result_user;
  }

  async getUuid(getUuidDto: GetUuidDto) {

    const uuid = getUuidDto.uuid;
    const type = getUuidDto.type;

    // uuid check
    const uuidRegex = /^(?=.*[a-z])(?=.*\d)[a-z\d]{5,20}$/;
    if (!uuidRegex.test(uuid)) {
      throw new BadRequestException('invalid_uuid');
    }

    const findUuid = await this.commonRepository.findUserUuid(uuid);

    if(type == 'normal') {
      if(!findUuid) {
        throw new NotFoundException('not_found_uuid');
      }
    }

    if(type == 'signup') {
      if(findUuid?.id) {
        throw new ConflictException('uuid_already_exists');
      }
    }

    return 200;
  }

  async getNickName(getNickNameDto: GetNickNameDto) {

    const nickName = getNickNameDto.nickName;

    const nameRegex = /^[가-힣a-zA-Z0-9]{2,10}$/;
    if (!nameRegex.test(nickName)) {
      throw new BadRequestException('invalid_nick_name');
    }

    const findNickName = await this.commonRepository.findNickName(nickName);

    if (findNickName?.nick_name) {
      throw new ConflictException('nick_name_already_exists');
    }

    return 200;

  }

  async sendUserAuthCode(sendUserAuthCodeDto: SendUserAuthCodeDto) {

    const phone = sendUserAuthCodeDto.phone;
    const type = sendUserAuthCodeDto.type;

    const phoneRegex = /^01[0-9][0-9]{3,4}[0-9]{4}$/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequestException('invalid_phone');
    }

    const findUserPhone = await this.commonRepository.findUserPhone(phone);
    if(type == 'signup') {
      if (findUserPhone?.phone) {
        throw new ConflictException('phone_already_exists');
      }
    }
    
    const authcode = await createAuthCodeWithLength(6);
    await this.commonRepository.insertPhoneAuthCode(phone, authcode);

    return authcode;
  }

  async checkUserAuthCode(authCodeDto: AuthCodeDto) {

    const phone = authCodeDto.phone;
    const auth_code = authCodeDto.auth_code;

    const phoneRegex = /^01[0-9][0-9]{3,4}[0-9]{4}$/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequestException('invalid_phone');
    }

    const findUserPhoneAuthCode = await this.commonRepository.findPhoneAuthCode(phone);

    if (!findUserPhoneAuthCode?.user_phone) {
      throw new NotFoundException('not_found_phone')
    }

    if (findUserPhoneAuthCode?.code != auth_code) {
      throw new BadRequestException('invalid_auth_code');
    }

    return 200;

  }

  async getReferrer(getReferrerDto: GetReferrerDto) {

    const referrer = getReferrerDto.referrer;

    const uuidRegex = /^(?=.*[a-z])(?=.*\d)[a-z\d]{5,20}$/;
    if (!uuidRegex.test(referrer)) {
      throw new BadRequestException('invalid_referrer');
    }

    const findReferrerUuid = await this.commonRepository.findReferrerUuid(referrer);

    if (!findReferrerUuid?.uuid) {
      throw new NotFoundException('not_found_user')
    }

    return 200;
  }


  async getRefreshToken(refreshTokenDto: RefreshTokenDto, request?: any, response?: Response) {

    let result = {
      accessToken: '',
      refreshToken: ''
    }

    // Refresh Token 우선순위: Body -> Cookie
    let refresh_token = refreshTokenDto.refesh_authorization;
    
    // Body에 토큰이 없으면 쿠키에서 확인 (PC 클라이언트용)
    if (!refresh_token && request && request.cookies) {
      refresh_token = request.cookies.refresh_token;
    }

    if (!refresh_token) {
      throw new BadRequestException('refresh_token_required');
    }

    const authVerify = this.authService.verifyToken(refresh_token);

    if (authVerify.user_id) {

      const access_token = this.authService.createAccessToken({
        user_id: authVerify.user_id, // id -> user_id 수정
        uuid: authVerify.uuid,
        user_name: authVerify.user_name,
        nick_name: authVerify.nick_name,
        user_status: authVerify.user_status,
        is_deleted: authVerify.is_deleted,
        type: 'access'
      })

      const new_refresh_token = this.authService.createRefreshToken({
        user_id: authVerify.user_id, // id -> user_id 수정
        uuid: authVerify.uuid,
        user_name: authVerify.user_name,
        nick_name: authVerify.nick_name,
        user_status: authVerify.user_status,
        is_deleted: authVerify.is_deleted,
        type: 'refresh'
      })

      result.accessToken = access_token;
      result.refreshToken = new_refresh_token;

      await this.commonRepository.updateUserTokenSet(result.accessToken, result.refreshToken, authVerify.user_id);

      // PC 클라이언트이고 쿠키로 요청이 왔다면 새로운 토큰을 쿠키에 저장
      if (request && request.cookies && request.cookies.refresh_token && response) {
        response.cookie('access_token', access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 1000 // 1시간
        });
        
        response.cookie('refresh_token', new_refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 24시간
        });

        // PC 클라이언트용 응답에서는 토큰 정보 제거
        result.accessToken = '';
        result.refreshToken = '';
      }

      return result;
    } else {
      throw new BadRequestException('invalid_refresh_token');
    }

  }

  async getUserUuid(getUserUuidDto : GetUserUuidDto) {

    const phone = getUserUuidDto.phone;
    const auth_code = getUserUuidDto.auth_code;

    const findUserPhoneAuthCode = await this.commonRepository.findPhoneAuthCode(phone);

    if (!findUserPhoneAuthCode?.user_phone) {
      throw new NotFoundException('not_found_phone');
    }

    if (findUserPhoneAuthCode?.code != auth_code) {
      throw new BadRequestException('invalid_auth_code');
    }

    const user = await this.commonRepository.getUserUuid(phone);
    
    if(!user) {
      throw new NotFoundException('not_found_user');
    }
    return user;
  }

  async getUserPassword(getUserPasswordDto : GetUserPasswordDto) {

    const uuid = getUserPasswordDto.uuid;
    const phone = getUserPasswordDto.phone;
    const auth_code = getUserPasswordDto.auth_code;

    // 유저 uuid 검사
    if(uuid) {
      const uuidRegex = /^(?=.*[a-z])(?=.*\d)[a-z\d]{5,20}$/;
      if (!uuidRegex.test(uuid)) {
        throw new ForbiddenException('invalid_uuid');
      }
    }
    
    if(phone) {
      const phoneRegex = /^01[0-9][0-9]{3,4}[0-9]{4}$/;
      if (!phoneRegex.test(phone)) {
        throw new ForbiddenException('invalid_phone');
      }
    }

    const findUserPhoneAuthCode = await this.commonRepository.findPhoneAuthCode(phone);

    if (!findUserPhoneAuthCode?.user_phone) {
      throw new NotFoundException('not_found_phone');
    }

    if (findUserPhoneAuthCode?.code != auth_code) {
      throw new BadRequestException('invalid_auth_code');
    }

    const userUuid = await this.commonRepository.getUserUuid(phone);
    if(!userUuid) {
      throw new NotFoundException('not_found_uuid');
    }

    if(userUuid.uuid != uuid) {
      throw new BadRequestException('uuid_mismatch');
    }

    return 200;

  }

  async updateUserPassword(updateUserPasswordDto : UpdateUserPasswordDto) {

    let parameter = {
      password : '',
      password_salt_key : ''
    };
    const uuid = updateUserPasswordDto.uuid;
    const phone = updateUserPasswordDto.phone;
    const auth_code = updateUserPasswordDto.auth_code;
    const password = updateUserPasswordDto.password;
    const check_password = updateUserPasswordDto.check_password;

    // 유저 uuid 검사
    if(uuid) {
      const uuidRegex = /^(?=.*[a-z])(?=.*\d)[a-z\d]{5,20}$/;
      if (!uuidRegex.test(uuid)) {
        throw new ForbiddenException('invalid_uuid');
      }
    }
    
    if(phone) {
      const phoneRegex = /^01[0-9][0-9]{3,4}[0-9]{4}$/;
      if (!phoneRegex.test(phone)) {
        throw new ForbiddenException('invalid_phone');
      }
    }

    if(password) {
      // 비밀번호 유효성 검사: 영문 + 숫자 + 특수문자 포함, 8자 이상
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*+])[A-Za-z\d!@#$%^&*+]{8,}$/;
      if (!passwordRegex.test(password)) {
        throw new ForbiddenException('invalid_password');
      }
    }

    if(check_password) {
      // 비밀번호 유효성 검사: 영문 + 숫자 + 특수문자 포함, 8자 이상
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*+])[A-Za-z\d!@#$%^&*+]{8,}$/;
      if (!passwordRegex.test(check_password)) {
        throw new ForbiddenException('invalid_password');
      }
    }

    if(password != check_password) {
      throw new BadRequestException('password_mismatch');
    }

    const findUserPhoneAuthCode = await this.commonRepository.findPhoneAuthCode(phone);

    if (!findUserPhoneAuthCode?.user_phone) {
      throw new NotFoundException('not_found_phone');
    }

    if (findUserPhoneAuthCode?.code != auth_code) {
      throw new BadRequestException('invalid_auth_code');
    }

    const userUuid = await this.commonRepository.getUserUuid(phone);

    if(!userUuid) {
      throw new NotFoundException('not_found_uuid');
    }

    if(userUuid.uuid != uuid) {
      throw new BadRequestException('uuid_mismatch');
    }

    const hashPassword = this.hashService.hashPasswordWithNewSalt(password);

    if(hashPassword) {
      parameter.password = hashPassword.hashedPassword;
      parameter.password_salt_key = hashPassword.salt;
    }

    await this.commonRepository.updateUserPassword(parameter.password, parameter.password_salt_key, uuid);

    return 200;

  }

}
