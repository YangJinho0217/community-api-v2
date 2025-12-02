import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn, IsNumber, Max, Min, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetCommentDto {

    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @IsNotEmpty({ message : 'Required post_id' })
    post_id: number; 

    @IsString()
    @IsNotEmpty({ message : 'Required filter' })
    @IsIn(['new', 'old'], {
        message: 'filter must be either new, old'
    })
    filter: string;

    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @IsNotEmpty({ message: 'Required page number' })
    page_no?: number;

    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1, { message: 'limit must be at least 1' })
    @Max(10, { message: 'limit must not exceed 10' })
    @IsNotEmpty({ message: 'Required limit' })
    limit?: number;

}