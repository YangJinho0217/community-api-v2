import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class GetUuidDto {

  @IsString()
  @IsNotEmpty({ message: 'Required uuid' })
  uuid: string; // 혹은 email, username 등으로 이름 변경 가능

}