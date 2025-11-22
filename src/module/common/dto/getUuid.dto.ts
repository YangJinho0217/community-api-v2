import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class GetUuidDto {

  @IsString()
  @IsNotEmpty({ message: 'Required uuid' })
  uuid: string; // 혹은 email, username 등으로 이름 변경 가능

  @IsString()
  @IsNotEmpty({ message: 'Required type' })
  @IsIn(
    ['signup', 'normal'], { 
      message: 'Type must be either all, normal'
    }
  )
  type: string; // 혹은 email, username 등으로 이름 변경 가능

}