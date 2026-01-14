import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyCognitoAccessToken, type VerifiedUser } from './cognito-jwt';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => (target: any, key?: any, desc?: any) => {
  Reflect.defineMetadata(IS_PUBLIC_KEY, true, desc?.value ?? target);
};

export type AuthConfig = {
  region: string;
  userPoolId: string;
  clientId: string;
};

@Injectable()
export class CognitoAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject('AUTH_CONFIG') private readonly config: AuthConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('ok');
    const handler = context.getHandler();
    const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, handler);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();

    const authHeader: string | undefined =
      req.headers?.authorization ?? req.headers?.Authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = authHeader.slice('Bearer '.length).trim();

    try {
      const user: VerifiedUser = await verifyCognitoAccessToken(
        token,
        this.config,
      );
      req.user = user; // attach pour controllers/services
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
