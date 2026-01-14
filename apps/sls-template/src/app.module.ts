import { ConfigModule, ConfigService } from '@nestjs/config';
import { Template, TemplateSchema } from './schema/template.schema';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@ms/auth';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/sls-template/.env.dev', '.env.dev', '.env'],
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
    MongooseModule.forFeature([
      { name: Template.name, schema: TemplateSchema },
    ]),
    AuthModule.forRootAsync(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
