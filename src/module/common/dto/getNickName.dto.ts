import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class GetNickNameDto {

  @IsString()
  @IsNotEmpty({ message: 'Required nickName' })
  nickName: string; 

}