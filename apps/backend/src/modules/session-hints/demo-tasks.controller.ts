import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.ts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import { DemoTasksService } from './demo-tasks.service.ts';
import { DemoTaskResponse, DemoTaskStateResponse } from './entities/demo-task.entity.ts';

@ApiTags('sessions')
@Controller('sessions/:id/demo-task')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DemoTasksController {
  constructor(private readonly demoTasksService: DemoTasksService) {}

  @Get()
  @ApiOperation({
    summary: 'Временно: включён ли демо-режим и текущая демо-задача комнаты (участники / admin)',
  })
  getState(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<DemoTaskStateResponse> {
    return this.demoTasksService.getState(sessionId, actor);
  }

  @Post('next')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Временно: показать следующую демо-задачу (только интервьюер). Рассылается всем по WebSocket: demo-task:changed',
  })
  next(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<DemoTaskResponse> {
    return this.demoTasksService.next(sessionId, actor);
  }
}
