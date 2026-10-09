import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service.ts';

@Module({
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
