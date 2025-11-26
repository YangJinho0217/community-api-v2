import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn, ValidateIf } from 'class-validator';

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
  @IsIn(['all', 'title', 'tag', 'poster'])
  @IsNotEmpty({ message: 'Required search filter' })
  filter?: string;
}