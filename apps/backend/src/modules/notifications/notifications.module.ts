import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EmailModule } from '../../infrastructure/email/email.module.ts';
import { TelegramModule } from '../../infrastructure/telegram/telegram.module.ts';
import { PrismaModule } from '../../prisma/prisma.module.ts';
import { NOTIFICATIONS_QUEUE } from './notifications.constants.ts';
import { NotificationDeliveryService } from './notification-delivery.service.ts';
import { NotificationsProcessor } from './notifications.processor.ts';
import { NotificationsRepository } from './notifications.repository.ts';
import { NotificationsService } from './notifications.service.ts';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    TelegramModule,
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
