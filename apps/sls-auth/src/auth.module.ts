import { CognitoConfig, CognitoService } from './cognito.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from './schema/user.schema';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/sls-auth/.env.dev', '.env.dev', '.env'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGODB_URI');

        if (!uri) {
          throw new Error('MONGODB_URI is not defined');
        }

        return {
          uri,
          serverSelectionTimeoutMS: 5000,
        };
      },
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    CognitoService,
    {
      provide: 'COGNITO_CONFIG',
      inject: [ConfigService],
      useFactory: (config: ConfigService): CognitoConfig => {
        const region = config.get<string>('COGNITO_REGION');
        const userPoolId = config.get<string>('COGNITO_USER_POOL_ID');
        const clientId = config.get<string>('COGNITO_CLIENT_ID');

        if (!region) throw new Error('COGNITO_REGION is not defined');
        if (!userPoolId) throw new Error('COGNITO_USER_POOL_ID is not defined');
        if (!clientId) throw new Error('COGNITO_CLIENT_ID is not defined');

        return { region, userPoolId, clientId };
      },
    },
  ],
})
export class AuthModule {}
