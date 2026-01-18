import { Body, Controller, Get, Inject, Logger, Post } from '@nestjs/common';

import { CognitoService } from './cognito.service';
import { Connection } from 'mongoose';
import { CredentialSigninDto } from './dto/credential-signin.dto';
import { CredentialSignupDto } from './dto/credential-signup.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { RedisService, REDIS_SERVICE } from '@ms/redis';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    @Inject(REDIS_SERVICE) private readonly redisService: RedisService,
    @Inject(CognitoService) private readonly cognitoService: CognitoService,
  ) {}

  @Get('health')
  async health() {
    try {
      const mongoState = this.mongoConnection.readyState;
      const redisStatus = await this.getRedisStatus();

      const mongoStatusMap: Record<number, string> = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };
      return {
        status: 'ok',
        dependencies: {
          mongo: mongoStatusMap[mongoState] ?? 'unknown',
          redis: redisStatus,
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

  private async getRedisStatus(): Promise<'connected' | 'disconnected'> {
    const redisStatus = await this.redisService.ping();
    return redisStatus === 'PONG' ? 'connected' : 'disconnected';
  }
}
