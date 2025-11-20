import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class GetReferrerDto {

  @IsString()
  @IsNotEmpty({ message: 'Required referrer' })
  referrer: string; 

}