import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { REDIS_CLIENT, REDIS_SERVICE } from './const';

import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({})
export class RedisModule {
  static forRootAsync(): DynamicModule {
    return {
      module: RedisModule,
      imports: [ConfigModule],

      providers: [
        {
          provide: REDIS_CLIENT,
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const MAX_RETRIES = 5;
            const redisClient = new Redis({
              host: configService.get<string>('REDIS_HOST'),
              port: configService.get<number>('REDIS_PORT'),
              retryStrategy: (times) => {
                if (times >= MAX_RETRIES) {
                  console.error(
                    `Redis failed after ${MAX_RETRIES} retries. Giving up.`,
                  );
                  return null;
                }
                const delay = Math.min(times * 100, 3000);
                console.warn(
                  `Redis connection attempt ${times}/${MAX_RETRIES}. Retrying in ${delay}ms...`,
                );
                return delay;
              },
            });
            redisClient.on('error', (error) => {
              console.error('Redis Error:', error.message);
            });

            return redisClient;
          },
        },
        {
          provide: REDIS_SERVICE,
          useClass: RedisService,
        },
      ],
      exports: [REDIS_CLIENT, REDIS_SERVICE],
    };
  }
}
