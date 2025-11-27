import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn, ValidateIf, IsNumber, Min, Max } from 'class-validator';

export class GetSearchDto {

  @IsString()
  @IsNotEmpty({ message: 'Required search' })
  search: string;

  @IsString()
  @IsNotEmpty({ message: 'Required search type' })
  @IsIn(['all', 'sports', 'com', 'news', 'user'])
  search_type: string;

  // 조건부 search_sub_type
  @ValidateIf(o => o.search_type === 'com')
  @IsString()
  @IsIn(['post', 'analyze', 'injury', 'lineup'])
  @IsNotEmpty({ message: 'Required search search_sub_type' })
  search_sub_type?: string;

  @ValidateIf(o => o.search_type === 'com')
  @IsString()
  @IsIn(['all', 'title', 'tag', 'author'])
  @IsNotEmpty({ message: 'Required search filter' })
  filter?: string;

  @Transform(({ value }) => parseInt(value))
  @ValidateIf(o => o.search_type === 'sports' || o.search_type === 'com' || o.search_type === 'news' || o.search_type === 'user')
  @IsNumber()
  @IsNotEmpty({ message: 'Required page number' })
  page_no?: number;

  @Transform(({ value }) => parseInt(value))
  @ValidateIf(o => o.search_type === 'sports' || o.search_type === 'com' || o.search_type === 'news' || o.search_type === 'user')
  @IsNumber()
  @Min(1, { message: 'limit must be at least 1' })
  @Max(10, { message: 'limit must not exceed 10' })
  @IsNotEmpty({ message: 'Required limit' })
  limit?: number;

}