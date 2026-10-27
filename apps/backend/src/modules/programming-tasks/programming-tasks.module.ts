import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.ts';
import { ProgrammingTasksController } from './programming-tasks.controller.ts';
import { ProgrammingTasksRepository } from './programming-tasks.repository.ts';
import { ProgrammingTasksService } from './programming-tasks.service.ts';

@Module({
  imports: [AuthModule],
  controllers: [ProgrammingTasksController],
  providers: [ProgrammingTasksRepository, ProgrammingTasksService],
  exports: [ProgrammingTasksService],
})
export class ProgrammingTasksModule {}
