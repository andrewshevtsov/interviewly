import { Module } from '@nestjs/common';
import { DeepseekModule } from '../../infrastructure/deepseek/deepseek.module.ts';
import { AuthModule } from '../auth/auth.module.ts';
import { SessionsModule } from '../sessions/sessions.module.ts';
import { DemoTasksController } from './demo-tasks.controller.ts';
import { DemoTasksService } from './demo-tasks.service.ts';
import { SessionHintsController } from './session-hints.controller.ts';
import { SessionHintsRepository } from './session-hints.repository.ts';
import { SessionHintsService } from './session-hints.service.ts';

@Module({
  imports: [AuthModule, SessionsModule, DeepseekModule],
  controllers: [SessionHintsController, DemoTasksController],
  providers: [SessionHintsService, SessionHintsRepository, DemoTasksService],
})
export class SessionHintsModule {}
