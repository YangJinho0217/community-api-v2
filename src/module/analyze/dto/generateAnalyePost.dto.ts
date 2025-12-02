import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn, IsNumber, Max, Min, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class GenerateAnalyzePostDto {

    @IsString()
    @IsNotEmpty({ message : 'Required sports_match_id' })
    sports_match_id: string;

    @IsString()
    @IsNotEmpty({ message : 'Required pick_winner_id' })
    pick_winner_id: string;

    @IsString()
    @IsNotEmpty({ message : 'Required content' })
    content: string;

}