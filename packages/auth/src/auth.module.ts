import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { CognitoAuthGuard, type AuthConfig } from './auth.guard';

const AUTH_CONFIG = 'AUTH_CONFIG';

@Global()
@Module({})
export class AuthModule {
  static forRoot(config: AuthConfig): DynamicModule {
    return {
      module: AuthModule,
      providers: [
        Reflector,
        { provide: AUTH_CONFIG, useValue: config },
        {
          provide: CognitoAuthGuard,
          useFactory: (reflector: Reflector) =>
            new CognitoAuthGuard(reflector, config),
          inject: [Reflector],
        },
      ],
      exports: [CognitoAuthGuard],
    };
  }

  static forRootAsync(): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        Reflector,
        {
          provide: AUTH_CONFIG,
          inject: [ConfigService],
          useFactory: (config: ConfigService): AuthConfig => {
            const region = config.get<string>('COGNITO_REGION');
            const userPoolId = config.get<string>('COGNITO_USER_POOL_ID');
            const clientId = config.get<string>('COGNITO_CLIENT_ID');

            if (!region) throw new Error('COGNITO_REGION is not defined');
            if (!userPoolId)
              throw new Error('COGNITO_USER_POOL_ID is not defined');
            if (!clientId) throw new Error('COGNITO_CLIENT_ID is not defined');

            return { region, userPoolId, clientId };
          },
        },
        CognitoAuthGuard,
      ],
      exports: [CognitoAuthGuard],
    };
  }
}
