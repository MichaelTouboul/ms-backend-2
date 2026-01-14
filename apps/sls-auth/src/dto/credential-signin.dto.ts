import { IsEmail, IsString } from 'class-validator';

export class CredentialSigninDto {
  @IsEmail()
  readonly email: string;

  @IsString()
  readonly password: string;
}
