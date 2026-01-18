import {
  Injectable,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { GoogleAuthDto } from './dto/google-auth.dto';
import { OAuth2Client } from 'google-auth-library';
import { User } from './schema/user.schema';
import { Role } from './lib/enums/role.enum';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  constructor(
    @InjectModel(User.name) private readonly UserModel: Model<User>,
    @Inject('GOOGLE_CLIENT') private readonly googleClient: OAuth2Client,
    private readonly authService: AuthService,
  ) {}

  async googleAuth({ idToken, googleUser }: GoogleAuthDto): Promise<{
    accessToken: string;
  }> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid token');
    }

    const { email } = payload;

    let user = await this.UserModel.findOne({ email });

    if (!user) {
      user = await new this.UserModel({
        name: googleUser.name,
        email: googleUser.email,
        image: googleUser.image,
        provider: 'google',
        googleId: googleUser.id,
        role: Role.GUEST,
        isActive: true,
        emailVerified: false,
      }).save();
    }

    const accessToken = await this.authService.accessTokenProvider(
      user._id.toHexString(),
      user.role,
    );
    await this.authService.generateAndStoreRefreshToken(user._id.toHexString());

    this.logger.log(`[SIGN-UP][CREDENTIALS]: ${user._id.toHexString()} `);

    return {
      accessToken,
    };
  }
}
