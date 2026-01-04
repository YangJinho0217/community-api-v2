import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn, ValidateIf, IsNumber, Min, Max } from 'class-validator';

export class GetSportsDto {

  @IsString()
  @IsNotEmpty({ message: 'Required date' })
  date: string;

  @IsString()
  @IsIn(['all', 'soccer', 'baseball', 'basketball', 'volleyball', 'lol'])
  @IsNotEmpty({ message: 'Required category' })
  category?: string;

  @IsString()
  @IsIn(['all', 'live', 'not_started', 'end'])
  @IsNotEmpty({ message: 'Required search filter' })
  filter?: string;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1, { message: 'limit must be at least 1' })
  @IsNotEmpty({ message: 'Required page number' })
  page_no?: number;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1, { message: 'limit must be at least 1' })
  @Max(10, { message: 'limit must not exceed 10' })
  @IsNotEmpty({ message: 'Required limit' })
  limit?: number;

}