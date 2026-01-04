import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LogOutDto {

  @IsString()
  @IsNotEmpty({ message : 'Required device type' })
  // @IsOptional()
  device_type : string;

}