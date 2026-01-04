import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn, IsNumber, Max, Min, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetCompetitionInGenerateAnalyzePostDto {

    @IsString()
    @IsNotEmpty({ message : 'Required category' })
    @IsIn(
    ['soccer', 'basketball', 'baseball', 'volleyball', 'lol'], { 
        message: 'category must be either soccer, basketball, baseball, volleyball, lol'
    }
    )
    category: string;

    @IsString()
    @IsNotEmpty({ message : 'Required date' })
    date: string;

}