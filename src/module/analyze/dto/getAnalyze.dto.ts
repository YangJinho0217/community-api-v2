import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn, IsNumber, Max, Min, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetAnalyzeDto {

    @IsString()
    @IsNotEmpty({ message : 'Required category' })
    @IsIn(
    ['all', 'soccer', 'basketball', 'baseball', 'volleyball', 'lol'], { 
        message: 'category must be either all, soccer, basketball, baseball, volleyball, lol'
    }
    )
    category: string; 

    @IsString()
    @IsNotEmpty({ message : 'Required feed_filter' })
    @IsIn(
    ['public', 'following'], { 
        message: 'feed_filter must be either public, following'
    }
    )
    feed_filter: string; 

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