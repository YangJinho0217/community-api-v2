import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class SignUpDto {

  @IsString()
  @IsNotEmpty({ message : 'Required uuid' })
  uuid: string; 

    @IsString()
    @IsNotEmpty({ message: 'Required user_name' })
    user_name: string; 

    @IsString()
    @IsNotEmpty({ message: 'Required phone' })
    phone: string; 

    @IsString()
    @IsNotEmpty({ message: 'Required nick_name' })
    nick_name: string; 

    @IsString()
    @IsNotEmpty({ message: 'Required password' })
    password: string; 

    @IsString()
    @IsNotEmpty({ message: 'Required terms' })
    @IsIn(['Y'])
    terms: string;

    @IsString()
    @IsNotEmpty({ message: 'Required privacy' })
    @IsIn(['Y'])
    privacy: string; 

    @IsString()
    @IsOptional()
    referrer: string; 

    @IsString()
    @IsOptional()
    location_terms: string; 

    @IsString()
    @IsOptional()
    marketing: string; 
  
}