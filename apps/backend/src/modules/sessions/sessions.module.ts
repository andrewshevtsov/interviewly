import { Module } from '@nestjs/common';
import { LivekitModule } from '../../infrastructure/livekit/livekit.module.ts';
import { NotificationsModule } from '../notifications/notifications.module.ts';
import { AuthModule } from '../auth/auth.module.ts';
import { SessionEditorController } from './session-editor.controller.ts';
import { SessionEditorService } from './session-editor.service.ts';
import { SessionsController } from './sessions.controller.ts';
import { SessionsGateway } from './sessions.gateway.ts';
import { SessionsRepository } from './sessions.repository.ts';
import { SessionsService } from './sessions.service.ts';

@Module({
  imports: [AuthModule, LivekitModule, NotificationsModule],
  controllers: [SessionsController, SessionEditorController],
  providers: [SessionsService, SessionsRepository, SessionsGateway, SessionEditorService],
  exports: [SessionsService, SessionsRepository, SessionsGateway],
})
export class SessionsModule {}
