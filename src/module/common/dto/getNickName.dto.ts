import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class getNickNameDto {

  @IsString()
  @IsNotEmpty({ message: 'Required nickName' })
  nickName: string; 

}