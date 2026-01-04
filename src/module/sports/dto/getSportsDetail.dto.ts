import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn, ValidateIf, IsNumber, Min, Max } from 'class-validator';

export class GetSportsDetailDto {

  @IsString()
  @IsNotEmpty({ message: 'Required sports_match_id' })
  sports_match_id: string;

  @IsString()
  @IsNotEmpty({ message: 'Required type' })
  @IsIn(['live', 'info', 'lineup'])
  type: string;

}