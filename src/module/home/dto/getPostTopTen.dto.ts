import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetPostTopTenDto {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'limit must be at least 1' })
  @Max(10, { message: 'limit must not exceed 10' })
  limit?: number;
}
