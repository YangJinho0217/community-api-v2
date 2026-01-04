import { IsNotEmpty, IsOptional, IsString, IsNumber, IsIn, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetAnalyzeMatchDto {
  @IsString()
  @IsNotEmpty({ message : 'Required category' })
  @IsIn(
    ['all', 'soccer', 'basketball', 'baseball', 'volleyball', 'lol'], { 
      message: 'category must be either all, soccer, basketball, baseball, volleyball, lol'
    }
  )
  category: string; 

}
