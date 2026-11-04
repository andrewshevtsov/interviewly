import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { ListProgrammingTasksQueryDto } from './dto/list-programming-tasks-query.dto.ts';
import { ProgrammingTaskListItemResponse } from './entities/programming-task.entity.ts';
import { ProgrammingTasksService } from './programming-tasks.service.ts';

@ApiTags('programming-tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('programming-tasks')
export class ProgrammingTasksController {
  constructor(private readonly service: ProgrammingTasksService) {}

  @Get()
  @ApiOperation({ summary: 'Активные задачи, доступные для выбранного языка' })
  findAvailable(
    @Query() query: ListProgrammingTasksQueryDto,
  ): Promise<ProgrammingTaskListItemResponse[]> {
    return this.service.findAvailable(query.language);
  }
}
