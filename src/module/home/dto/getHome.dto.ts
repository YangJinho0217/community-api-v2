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

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsNotEmpty({ message : 'Required news_limit' })
  @Min(1, { message: 'news_limit must be at least 1' })
  @Max(8, { message: 'news_limit must not exceed 8' })
  news_limit: number; 

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsNotEmpty({ message : 'Required post_limit' })
  @Min(1, { message: 'post_limit must be at least 1' })
  @Max(10, { message: 'post_limit must not exceed 10' })
  post_limit: number; 

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsNotEmpty({ message : 'Required injury_limit' })
  @Min(1, { message: 'injury_limit must be at least 1' })
  @Max(10, { message: 'injury_limit must not exceed 10' })
  injury_limit: number;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsNotEmpty({ message : 'Required lineup_limit' })
  @Min(1, { message: 'lineup_limit must be at least 1' })
  @Max(10, { message: 'lineup_limit must not exceed 10' })
  lineup_limit: number; 

}