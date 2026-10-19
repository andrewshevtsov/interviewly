import { Module } from '@nestjs/common';
import { TelegramModule } from '../../infrastructure/telegram/telegram.module.ts';
import { TelegramBotController } from './telegram-bot.controller.ts';
import { TelegramBotService } from './telegram-bot.service.ts';

@Module({
  imports: [TelegramModule],
  controllers: [TelegramBotController],
  providers: [TelegramBotService],
})
export class TelegramBotModule {}
