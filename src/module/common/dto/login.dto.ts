import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {

  @IsString()
  @IsNotEmpty({ message: 'Required uuid' })
  uuid: string; // 혹은 email, username 등으로 이름 변경 가능

  @IsString() 
  @IsNotEmpty({ message: 'Required password' })
  password: string;

  @IsString()
  @IsNotEmpty({ message : 'Required device type' })
  // @IsOptional()
  device_type : string;

  @IsString()
  @IsOptional()
  fcm_token : string;

  @IsString()
  @IsOptional()
  device_os : string;

}