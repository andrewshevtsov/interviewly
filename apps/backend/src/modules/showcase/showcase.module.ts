import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module.ts';
import { ShowcaseController } from './showcase.controller.ts';
import { NotificationsModule } from '../notifications/notifications.module.ts';
import { SessionsModule } from '../sessions/sessions.module.ts';
import { ShowcaseResponsesController } from './showcase-responses.controller.ts';
import { ShowcaseResponsesRepository } from './showcase-responses.repository.ts';
import { ShowcaseResponsesService } from './showcase-responses.service.ts';
import { ShowcaseRepository } from './showcase.repository.ts';
import { ShowcaseService } from './showcase.service.ts';

@Module({
  imports: [PrismaModule, JwtModule.register({}), SessionsModule, NotificationsModule],
  controllers: [ShowcaseController, ShowcaseResponsesController],
  providers: [
    ShowcaseService,
    ShowcaseRepository,
    ShowcaseResponsesService,
    ShowcaseResponsesRepository,
  ],
})
export class ShowcaseModule {}
