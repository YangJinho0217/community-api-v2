import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn, IsNumber, Max, Min, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetAnalyzeDetailDto {

    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @IsNotEmpty({ message : 'Required post_id' })
    post_id: number; 

}