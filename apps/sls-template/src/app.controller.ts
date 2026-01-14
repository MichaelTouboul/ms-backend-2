import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AppService } from './app.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CognitoAuthGuard, Public } from '@ms/auth';

@Controller()
@UseGuards(CognitoAuthGuard)
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    @Inject(AppService) private readonly appService: AppService,
  ) {}

  @Public()
  @Get('health')
  health() {
    try {
      const mongoState = this.mongoConnection.readyState;

      const mongoStatusMap: Record<number, string> = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };
      return {
        status: 'ok',
        mongo: {
          state: mongoStatusMap[mongoState] ?? 'unknown',
        },
      };
    } catch (e) {
      this.logger.log(e);
      return e;
    }
  }

  @Post()
  async create(@Body() payload: any) {
    // TODO: Create dto
    return await this.appService.create(payload);
  }
}
