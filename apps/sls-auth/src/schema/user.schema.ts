import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Role } from '../lib/enums/role.enum';

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, type: String })
  userId: string;

  @Prop({ type: String })
  name?: string;

  @Prop({ required: true, unique: true, type: String })
  email: string;

  @Prop({ enum: ['google', 'credentials'], required: true, type: String })
  provider: 'google' | 'credentials';

  @Prop({ type: String })
  googleId?: string;

  @Prop({ required: true, enum: Role, type: String })
  role: Role;

  @Prop({ type: Date })
  lastLogin?: Date;

  @Prop({ default: true, type: Boolean })
  isActive: boolean;

  @Prop({ default: false, type: Boolean })
  emailVerified: boolean;

  @Prop({ type: String })
  locale?: string;

  @Prop({ type: String })
  timezone?: string;

  @Prop({
    enum: ['web', 'chrome-extension', 'api'],
    default: 'web',
    type: String,
  })
  signupSource: 'web' | 'chrome-extension' | 'api';
}

export const UserSchema = SchemaFactory.createForClass(User);
