import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.ts';
import { SessionsModule } from '../sessions/sessions.module.ts';
import { CODE_EXECUTIONS_QUEUE } from './code-executions.constants.ts';
import { CodeExecutionsController } from './code-executions.controller.ts';
import { CodeExecutionsProcessor } from './code-executions.processor.ts';
import { CodeExecutionsService } from './code-executions.service.ts';
import { CoderunnerClientService } from './coderunner-client.service.ts';
import { CollaborationClientService } from './collaboration-client.service.ts';

@Module({
  imports: [
    AuthModule,
    SessionsModule,
    BullModule.registerQueue({ name: CODE_EXECUTIONS_QUEUE }),
  ],
  controllers: [CodeExecutionsController],
  providers: [
    CodeExecutionsService,
    CodeExecutionsProcessor,
    CoderunnerClientService,
    CollaborationClientService,
  ],
})
export class CodeExecutionsModule {}
