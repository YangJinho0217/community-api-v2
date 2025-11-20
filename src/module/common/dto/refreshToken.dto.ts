import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {

  @IsString()
  @IsNotEmpty({ message: 'Required refesh_authorization' })
  refesh_authorization: string; 

}