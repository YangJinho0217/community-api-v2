import { IsNotEmpty, IsOptional, IsString, IsNumber, IsIn, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetNewsDto {
  @IsString()
  @IsNotEmpty({ message : 'Required category' })
  @IsIn(
    ['all', 'soccer', 'basketball', 'baseball', 'volleyball', 'lol'], { 
      message: 'category must be either all, soccer, basketball, baseball, volleyball, lol'
    }
  )
  category: string; 

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'limit must be at least 1' })
  @Max(20, { message: 'limit must not exceed 20' })
  limit?: number;
}
