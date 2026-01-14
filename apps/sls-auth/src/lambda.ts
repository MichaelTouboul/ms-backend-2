import 'reflect-metadata';

import { AuthModule } from './auth.module';
import type { Handler } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { configure as serverlessExpress } from '@vendia/serverless-express';

let cachedHandler: Handler | undefined;

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AuthModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.enableCors();

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (event, context, callback) => {
  if (!cachedHandler) {
    cachedHandler = await bootstrap();
  }

  return cachedHandler(event, context, callback);
};
