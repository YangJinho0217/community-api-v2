import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class AuthCodeDto {

  @IsString()
  @IsNotEmpty({ message : 'Required phone' })
  phone: string; 

  @IsString()
  @IsNotEmpty({ message: 'Required auth code' })
  auth_code: string; 

}