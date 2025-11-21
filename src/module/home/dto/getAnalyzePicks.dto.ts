import { IsNotEmpty, IsOptional, IsString, IsNumber, IsIn, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetAnalyzePicksDto {
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
  @IsOptional()
  @Min(1, { message: 'limit must be at least 1' })
  @Max(10, { message: 'limit must not exceed 10' })
  limit?: number;
}
