import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class sendUserAuthCodeDto {

  @IsString()
  @IsNotEmpty({ message: 'Required phone' })
  phone: string; 

}