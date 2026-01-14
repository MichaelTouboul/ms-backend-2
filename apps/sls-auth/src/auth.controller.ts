import { Body, Controller, Get, Inject, Logger, Post } from '@nestjs/common';

import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CredentialSigninDto } from './dto/credential-signin.dto';
import { CredentialSignupDto } from './dto/credential-signup.dto';
import { CognitoService } from './cognito.service';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    @Inject(CognitoService) private readonly cognitoService: CognitoService,
  ) {}

  @Get('health')
  health() {
    try {
      const mongoState = this.mongoConnection.readyState;

      const mongoStatusMap: Record<number, string> = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };
      return {
        status: 'ok',
        mongo: {
          state: mongoStatusMap[mongoState] ?? 'unknown',
        },
      };
    } catch (e) {
      this.logger.log(e);
      return e;
    }
  }

  @Post('credential/sign-in')
  async credentialSignin(@Body() payload: CredentialSigninDto): Promise<{
    accessToken: string;
  }> {
    return await this.cognitoService.credentialSignin(payload);
  }

  @Post('credential/sign-up')
  async credentialSignup(@Body() payload: CredentialSignupDto) {
    return await this.cognitoService.credentialSignup(payload);
  }
}
