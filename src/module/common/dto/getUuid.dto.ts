import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class GetUuidDto {

  @IsString()
  @IsNotEmpty({ message: 'Required uuid' })
  uuid: string; // 혹은 email, username 등으로 이름 변경 가능

  @IsString()
  @IsNotEmpty({ message: 'Required uuid' })
  @IsIn(
    ['signup', 'normal'], {
      message: 'type must be either signup, normal'
    }
  )
  type: string; // 혹은 email, username 등으로 이름 변경 가능

}
