import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from '../../infrastructure/email/email.module.ts';
import { TelegramModule } from '../../infrastructure/telegram/telegram.module.ts';
import { PrismaModule } from '../../prisma/prisma.module.ts';
import { NOTIFICATIONS_QUEUE } from './notifications.constants.ts';
import { NotificationDeliveryService } from './notification-delivery.service.ts';
import { NotificationsProcessor } from './notifications.processor.ts';
import { NotificationsRepository } from './notifications.repository.ts';
import { NotificationsService } from './notifications.service.ts';
import { parseRedisUrl } from './redis-connection.ts';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    TelegramModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: parseRedisUrl(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379'),
      }),
    }),
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
  ],
  providers: [
    NotificationsService,
    NotificationsProcessor,
    NotificationsRepository,
    NotificationDeliveryService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
