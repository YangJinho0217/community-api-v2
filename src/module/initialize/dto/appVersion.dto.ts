import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class AppVersionDto {

  @IsString()
  @IsNotEmpty({ message: 'Required devie type' })
  device_type: string; // 혹은 email, username 등으로 이름 변경 가능

  @IsString()
  @IsNotEmpty({ message : 'Required version' })
  // @IsOptional()
  version : string;
}