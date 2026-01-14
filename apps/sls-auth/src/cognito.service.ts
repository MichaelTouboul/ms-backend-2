import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';
import { type JWTPayload } from 'jose';
import { randomUUID } from 'crypto';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { CredentialSigninDto } from './dto/credential-signin.dto';
import { CredentialSignupDto } from './dto/credential-signup.dto';

export type CognitoConfig = {
  region: string;
  userPoolId: string;
  clientId: string;
};

export type VerifiedUser = {
  sub: string;
  email?: string;
  username?: string;
  groups?: string[];
  scope?: string;
  payload: JWTPayload;
};

// TODO: Create helper or utils and move functions

function cognitoClient(region: string) {
  return new CognitoIdentityProviderClient({ region });
}

@Injectable()
export class CognitoService {
  private readonly logger = new Logger(CognitoService.name);

  constructor(
    @InjectModel(User.name) private readonly UserModel: Model<User>,
    @Inject('COGNITO_CONFIG') private readonly cfg: CognitoConfig,
  ) {}

  async credentialSignin({ email, password }: CredentialSigninDto): Promise<{
    accessToken: string;
    idToken: string;
    refreshToken?: string;
    expiresIn?: number;
    tokenType?: string;
  }> {
    const client = cognitoClient(this.cfg.region);
    const cmd = new InitiateAuthCommand({
      ClientId: this.cfg.clientId,
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const res = await client.send(cmd);
    const auth = res.AuthenticationResult;
    if (!auth || !auth?.AccessToken || !auth?.IdToken) {
      // Common reasons:
      // - user not confirmed (needs ConfirmSignUp)
      // - wrong password
      // - auth flow not enabled on the app client
      throw new Error('Cognito sign-in failed: missing tokens in response');
    }

    this.logger.log(`[SIGN-IN]: User email: ${email} `);

    return {
      accessToken: auth.AccessToken,
      idToken: auth.IdToken,
      refreshToken: auth.RefreshToken,
      expiresIn: auth.ExpiresIn,
      tokenType: auth.TokenType,
    };
  }

  async credentialSignup({ email, password }: CredentialSignupDto): Promise<{
    userSub: string;
    userConfirmed: boolean;
    codeDeliveryDestination?: string;
    codeDeliveryMedium?: string;
  }> {
    const client = cognitoClient(this.cfg.region);
    const username = randomUUID();

    const cmd = new SignUpCommand({
      ClientId: this.cfg.clientId,
      Username: username,
      Password: password,
      UserAttributes: [{ Name: 'email', Value: email }],
    });

    const res = await client.send(cmd);

    return {
      userSub: res.UserSub ?? '',
      userConfirmed: Boolean(res.UserConfirmed),
      codeDeliveryDestination: res.CodeDeliveryDetails?.Destination,
      codeDeliveryMedium: res.CodeDeliveryDetails?.DeliveryMedium,
    };
  }
}
