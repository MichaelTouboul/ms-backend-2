import { ConfigModule, ConfigService } from '@nestjs/config';
import { Template, TemplateSchema } from './schema/template.schema';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
