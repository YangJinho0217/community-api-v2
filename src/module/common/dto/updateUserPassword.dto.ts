import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserPasswordDto {

  @IsString()
  @IsNotEmpty({ message: 'Required uuid' })
  uuid: string; // 혹은 email, username 등으로 이름 변경 가능

  @IsString()
  @IsNotEmpty({ message: 'Required phone' })
  phone: string; // 혹은 email, username 등으로 이름 변경 가능

  @IsString()
  @IsNotEmpty({ message: 'Required auth_code' })
  auth_code: string; // 혹은 email, username 등으로 이름 변경 가능

  @IsString()
  @IsNotEmpty({ message: 'Required password' })
  password: string; // 혹은 email, username 등으로 이름 변경 가능

  @IsString()
  @IsNotEmpty({ message: 'Required check_password' })
  check_password: string; // 혹은 email, username 등으로 이름 변경 가능

}