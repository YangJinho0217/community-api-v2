import { IsNotEmpty, IsOptional, IsString, IsNumber, IsIn, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class VisitorDto {
  @IsString()
  @IsNotEmpty({ message : 'Required visitor_name' })
  visitor_name: string; 
}
