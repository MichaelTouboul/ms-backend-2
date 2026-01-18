import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly client: Redis) {}

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async set<T = string>(
    key: string,
    value: T,
    options?: { EX?: number },
  ): Promise<'OK'> {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value);

    if (options?.EX) {
      return this.client.set(key, stringValue, 'EX', options.EX);
    }

    return this.client.set(key, stringValue);
  }

  async get<T = string>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    try {
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return raw as T;
    }
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async isRevoked(jti: string): Promise<boolean> {
    const exists = await this.client.exists(`bl:${jti}`);
    return exists === 1;
  }

  async revokeToken(jti: string, ttl: number): Promise<void> {
    await this.set(`bl:${jti}`, 'revoked', { EX: ttl });
  }
}
