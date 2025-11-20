import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class SendUserAuthCodeDto {

  @IsString()
  @IsNotEmpty({ message: 'Required phone' })
  phone: string; 

  @IsString()
  @IsNotEmpty({ message: 'Required type' })
  @IsIn(['signup', 'normal'], { message: 'type must be either signup or normal' })
  type: string; 

}