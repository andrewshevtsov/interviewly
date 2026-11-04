import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.ts';
import { ProgrammingTasksController } from './programming-tasks.controller.ts';
import { ProgrammingTasksAdminController } from './programming-tasks-admin.controller.ts';
import { ProgrammingTasksRepository } from './programming-tasks.repository.ts';
import { ProgrammingTasksService } from './programming-tasks.service.ts';
import { CoderunnerClientService } from '../code-executions/coderunner-client.service.ts';
import { CODE_EXECUTIONS_QUEUE } from '../code-executions/code-executions.constants.ts';
import { PROGRAMMING_TASK_VERIFICATIONS_QUEUE } from './programming-task-verification.constants.ts';
import { ProgrammingTaskVerificationProcessor } from './programming-task-verification.processor.ts';
import { ProgrammingTaskVerificationRecoveryService } from './programming-task-verification-recovery.service.ts';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue(
      { name: PROGRAMMING_TASK_VERIFICATIONS_QUEUE },
      { name: CODE_EXECUTIONS_QUEUE },
    ),
  ],
  controllers: [ProgrammingTasksController, ProgrammingTasksAdminController],
  providers: [
    ProgrammingTasksRepository,
    ProgrammingTasksService,
    ProgrammingTaskVerificationProcessor,
    ProgrammingTaskVerificationRecoveryService,
    CoderunnerClientService,
  ],
  exports: [ProgrammingTasksService],
})
export class ProgrammingTasksModule {}
