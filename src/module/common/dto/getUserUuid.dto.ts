import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class GetUserUuidDto {

  @IsString()
  @IsNotEmpty({ message: 'Required phone' })
  phone: string; // 혹은 email, username 등으로 이름 변경 가능

  @IsString()
  @IsNotEmpty({ message: 'Required auth_code' })
  auth_code: string; // 혹은 email, username 등으로 이름 변경 가능

}