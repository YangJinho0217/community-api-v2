import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn, IsNumber, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetHomeDto {

  @IsString()
  @IsNotEmpty({ message : 'Required category' })
  @IsIn(
    ['all', 'soccer', 'basketball', 'baseball', 'volleyball', 'lol'], { 
      message: 'category must be either all, soccer, basketball, baseball, volleyball, lol'
    }
  )
  category: string; 

  @IsString()
  @IsOptional()
  date: string; 

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsNotEmpty({ message : 'Required ap_limit' })
  @Min(1, { message: 'ap_limit must be at least 1' })
  @Max(8, { message: 'ap_limit must not exceed 8' })
  ap_limit: number; 

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsNotEmpty({ message : 'Required ls_limit' })
  @Min(1, { message: 'ls_limit must be at least 1' })
  @Max(8, { message: 'ls_limit must not exceed 8' })
  ls_limit: number; 

}