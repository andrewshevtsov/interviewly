import { Module } from '@nestjs/common';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';

/** Объединяет HTTP-контроллер запуска и сервис обращения к backend/Piston. */
@Module({
  controllers: [ExecutionController],
  providers: [ExecutionService],
})
export class ExecutionModule {}
