import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn, IsNumber, Max, Min, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class GenerateReplyDto {

    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @IsNotEmpty({ message : 'Required post_id' })
    post_id: number; 

    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @IsNotEmpty({ message : 'Required comment_id' })
    comment_id: number; 

    @IsString()
    @IsNotEmpty({ message : 'Required content' })
    content: string;

}