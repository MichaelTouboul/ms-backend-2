import { IsObject, IsString } from 'class-validator';

import { GoogleUserDto } from './google-user.dto';

export class GoogleAuthDto {
  @IsString()
  idToken: string;

  @IsObject()
  googleUser: GoogleUserDto;
}
