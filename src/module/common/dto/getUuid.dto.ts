import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class GetUuidDto {

  @IsString()
  @IsNotEmpty({ message: 'Required uuid' })
  uuid: string; // 혹은 email, username 등으로 이름 변경 가능
<<<<<<< HEAD
=======
<<<<<<< HEAD

  @IsString()
  @IsNotEmpty({ message: 'Required uuid' })
  @IsIn(
    ['signup', 'normal'], {
      message: 'type must be either signup, normal'
    }
  )
  type: string; // 혹은 email, username 등으로 이름 변경 가능

}
=======
>>>>>>> 01d63fe51d8077675ed9887a1735b69fd695d8e4
  
  @IsString()
  @IsNotEmpty({ message: 'Required uuid' })
  @IsIn(
    ['signup', 'normal'], { 
      message: 'type must be either signup, normal!'
    }
  )
  type: string; // 혹은 email, username 등으로 이름 변경 가능
  
}
<<<<<<< HEAD
=======
>>>>>>> 75ed3dae3c1dfcffabe643cff55616e026e8c77f
>>>>>>> 01d63fe51d8077675ed9887a1735b69fd695d8e4
