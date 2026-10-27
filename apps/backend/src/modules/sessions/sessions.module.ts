import { Module } from '@nestjs/common';
import { LivekitModule } from '../../infrastructure/livekit/livekit.module.ts';
import { NotificationsModule } from '../notifications/notifications.module.ts';
import { AuthModule } from '../auth/auth.module.ts';
import { ProgrammingTasksModule } from '../programming-tasks/programming-tasks.module.ts';
import { SessionEditorController } from './session-editor.controller.ts';
import { SessionEditorService } from './session-editor.service.ts';
import { SessionsController } from './sessions.controller.ts';
import { SessionsGateway } from './sessions.gateway.ts';
import { SessionsInternalController } from './sessions-internal.controller.ts';
import { SessionsRepository } from './sessions.repository.ts';
import { SessionsService } from './sessions.service.ts';

@Module({
  imports: [
    AuthModule,
    LivekitModule,
    NotificationsModule,
    ProgrammingTasksModule,
  ],
  controllers: [
    SessionsController,
    SessionsInternalController,
    SessionEditorController,
  ],
  providers: [
    SessionsService,
    SessionsRepository,
    SessionsGateway,
    SessionEditorService,
  ],
  exports: [SessionsService, SessionsRepository, SessionsGateway],
})
export class SessionsModule {}
