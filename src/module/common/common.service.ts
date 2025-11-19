import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { CommonRepository } from './common.repository';
import { HashService } from 'src/common/hash.service';
import { AuthService } from 'src/auth/auth.service';

// Util
import { createAuthCodeWithLength } from 'src/common/authCode.util';

// DTO
import { LoginDto } from './dto/login.dto';
import { getUuidDto } from './dto/getUuid.dto';
import { getNickNameDto } from './dto/getNickName.dto';
import { sendUserAuthCodeDto } from './dto/sendUserCode.dto';
import { authCodeDto } from './dto/authCode.dto';
import { getReferrerDto } from './dto/getReferrer.dto';

@Injectable()
export class CommonService {

  constructor(
    private readonly commonRepository : CommonRepository,
    private readonly hashService : HashService,
    private readonly authService : AuthService
  ) {}

  async getFindAll() {
    return this.commonRepository.findAll();
  }

  async tryLogin(loginDto : LoginDto) {

    const user = await this.commonRepository.findUserOne(loginDto.uuid);
    
    if(user.length < 1) {
      throw new NotFoundException('not_found_user');
    }

    if(user[0].user_status == 1) {
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
      user_id : user[0].id,
      uuid : user[0].uuid,
      user_name : user[0].user_name,
      nick_name : user[0].nick_name,
      user_status : user[0].user_status,
      is_deleted : user[0].is_deleted,
      type : 'access'
    })

    user[0].access_token = access_token;

    const refresh_token = this.authService.createRefreshToken({
      user_id : user[0].id,
      uuid : user[0].uuid,
      user_name : user[0].user_name,
      nick_name : user[0].nick_name,
      user_status : user[0].user_status,
      is_deleted : user[0].is_deleted,
      type : 'refresh'
    })

    user[0].refresh_token = refresh_token;

    const session_parameter = {
      user_id : user[0].id,
      session : access_token,
      refresh_session : refresh_token,
      device_type : loginDto.device_type,
      device_os : loginDto.device_os || null,
      fcm_token : loginDto.fcm_token || null
    }

    // 트랜잭션으로 FCM 토큰 업데이트와 세션 삽입을 함께 처리
    await this.commonRepository.updateFcmTokenAndInsertSession(session_parameter);

    const result_user = {
      user_id : user[0].id,
      uuid : user[0].uuid,
      user_type : user[0].user_type,
      user_name : user[0].user_name,
      insignia_img : user[0].insignia_img,
      phone : user[0].phone,
      nick_name : user[0].nick_name,
      user_level : user[0].user_level,
      level_name : user[0].level_name,
      user_status : user[0].user_status,
      point : user[0].point,
      img : user[0].img,
      user_exp : user[0].user_exp,
      follower : user[0].follower,
      following : user[0].following,
      authorization : session_parameter.session,
      refesh_authorization : session_parameter.refresh_session,
      noti_count : user[0].noti_count
    }

    return result_user;
  }

  async getUuid(getUuidDto : getUuidDto) {

    const uuid = getUuidDto.uuid;

    // uuid check
    const uuidRegex = /^(?=.*[a-z])(?=.*\d)[a-z\d]{5,20}$/;
    if(!uuidRegex.test(uuid)) {
      throw new BadRequestException('invalid_uuid_format');
    }

    const findUuid = await this.commonRepository.findUserUuid(uuid);

    if(findUuid?.id) {
      throw new ConflictException('uuid_already_exists');
    }
    
    return 200;

  }

  async getNickName(getNickNameDto : getNickNameDto) {
    
    const nickName = getNickNameDto.nickName;

    const nameRegex = /^[가-힣a-zA-Z0-9]{2,10}$/;
    if(!nameRegex.test(nickName)) {
      throw new BadRequestException('invalid_nickName_format');
    }

    const findNickName = await this.commonRepository.findNickName(nickName);
    
    if(findNickName?.nick_name) {
      throw new ConflictException('nickName_already_exists');
    }

    return 200;

  }

  async sendUserAuthCode(sendUserAuthCodeDto : sendUserAuthCodeDto) {

    const phone = sendUserAuthCodeDto.phone;

    const phoneRegex = /^01[0-9][0-9]{3,4}[0-9]{4}$/;
    if (!phoneRegex.test(phone)) {
        throw new BadRequestException('invalid_phone_format');
    }

    const findUserPhone = await this.commonRepository.findUserPhone(phone);
    if(findUserPhone?.phone) {
      throw new ConflictException('phone_already_exists');
    }

    const authcode = await createAuthCodeWithLength(6);
    await this.commonRepository.insertPhoneAuthCode(phone, authcode);
  
    return authcode;
  }

  async checkUserAuthCode(authCodeDto : authCodeDto) {

    const phone = authCodeDto.phone;
    const auth_code = authCodeDto.auth_code;

    const phoneRegex = /^01[0-9][0-9]{3,4}[0-9]{4}$/;
    if (!phoneRegex.test(phone)) {
        throw new BadRequestException('invalid_phone_format');
    }

    const findUserPhoneAuthCode = await this.commonRepository.findPhoneAuthCode(phone);

    if(!findUserPhoneAuthCode?.phone) {
      throw new NotFoundException('not_found_phone')
    }
    
    if(findUserPhoneAuthCode?.code != auth_code) {
      throw new BadRequestException('invalid_auth_code');
    }

    return 200;

  }

  async getReferrer(getReferrerDto : getReferrerDto) {

    const referrer = getReferrerDto.referrer;

    const uuidRegex = /^(?=.*[a-z])(?=.*\d)[a-z\d]{5,20}$/;
    if(!uuidRegex.test(referrer)) {
      throw new BadRequestException('invalid_referrer_format');
    }

    const findReferrerUuid = await this.commonRepository.findReferrerUuid(referrer);

    if(!findReferrerUuid?.uuid) {
      throw new NotFoundException('not_found_user')
    }

    return 200;
  }

  
  
}
