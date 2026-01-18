import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { User } from './user.schema';

@Schema({
  collection: 'sessions',
  timestamps: true,
})
export class Session {
  @Prop({ type: String, ref: User.name, required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  userId: string;

  // store HASH only (sha256), never the raw refresh token
  @Prop({ type: String, required: true, unique: true, index: true })
  tokenHash: string;

  @Prop({ type: Date })
  lastUsedAt?: Date;

  // TTL uses this field
  @Prop({ type: Date, required: true, index: true })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  revokedAt?: Date | null;

  @Prop({ type: Date, default: null })
  rotatedAt?: Date | null;

  @Prop({ type: String })
  replacedByTokenHash?: string;
}

export type SessionDocument = Session & Document;
export const SessionSchema = SchemaFactory.createForClass(Session);

// TTL index: auto delete when expiresAt < now
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// helpful query index (list active sessions for user fast)
SessionSchema.index({ userId: 1, revokedAt: 1 });
