import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcryptjs';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from './lib/enums/role.enum';
import { Session } from './schema/sessions.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisService } from '@ms/redis';

const BCRYPT_SALT_ROUNDS = 10;
const TOKEN_VALIDATION = '1d';
@Injectable()
export class AuthService {
  private readonly logger = new Logger();
  constructor(
    @Inject('JWT_SECRET') private readonly jwtSecret: string,
    @InjectModel(Session.name) private readonly SessionModel: Model<Session>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async logout(token: string): Promise<{ success: boolean }> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.jwtSecret,
      });

      if (!payload.jti) {
        throw new UnauthorizedException('Token missing jti');
      }

      const expiresInSeconds = payload.exp
        ? payload.exp - Math.floor(Date.now() / 1000)
        : 15 * 60; // fallback 15 minutes if exp is missing

      await this.redisService.set(`bl:${payload.jti}`, 'revoked', {
        EX: expiresInSeconds,
      });

      return { success: true };
    } catch (err) {
      this.logger.error(err);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async generateAndStoreRefreshToken(userId: string): Promise<string> {
    const refreshToken = await this.refreshTokenProvider(userId);
    const hashedRefreshToken = await this.hashRefreshToken(refreshToken);

    await this.SessionModel.updateOne(
      { userId },
      { refreshToken: hashedRefreshToken },
    );

    return refreshToken;
  }

  async accessTokenProvider(userId: string, role: Role): Promise<string> {
    const accessSecretKey: string =
      this.configService.get<string>('JWT_ACCESS_SECRET')!;
    const jti = crypto.randomUUID();
    const payload = { sub: userId, role: role, jti };
    return await this.jwtService.signAsync(payload, {
      secret: accessSecretKey,
      expiresIn: TOKEN_VALIDATION,
    });
  }

  async refreshTokenProvider(userId: string): Promise<string> {
    const refreshSecretKey: string =
      this.configService.get<string>('JWT_REFRESH_SECRET')!;
    return await this.jwtService.signAsync(
      { sub: userId },
      {
        secret: refreshSecretKey,
        expiresIn: '7d',
      },
    );
  }

  private async hashRefreshToken(token: string): Promise<string> {
    return await bcrypt.hash(token, BCRYPT_SALT_ROUNDS);
  }
}
