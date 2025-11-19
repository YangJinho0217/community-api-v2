import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class getReferrerDto {

  @IsString()
  @IsNotEmpty({ message: 'Required referrer' })
  referrer: string; 

}