import { Module } from '@nestjs/common';
import { LivekitModule } from '../../infrastructure/livekit/livekit.module.ts';
import { AuthModule } from '../auth/auth.module.ts';
import { SessionsController } from './sessions.controller.ts';
import { SessionsRepository } from './sessions.repository.ts';
import { SessionsService } from './sessions.service.ts';

@Module({
  imports: [AuthModule, LivekitModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionsRepository],
  exports: [SessionsService],
})
export class SessionsModule {}
