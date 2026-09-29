import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.ts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import { RequestHintDto } from './dto/request-hint.dto.ts';
import { SessionHintEntity, SessionHintsResponse } from './entities/session-hint.entity.ts';
import { SessionHintsService } from './session-hints.service.ts';

@ApiTags('sessions')
@Controller('sessions/:id/hints')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class SessionHintsController {
  constructor(private readonly hintsService: SessionHintsService) {}

  @Get()
  @ApiOperation({ summary: 'AI-подсказки сессии и остаток лимита (владелец / участники / admin)' })
  list(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<SessionHintsResponse> {
    return this.hintsService.list(sessionId, actor);
  }

  @Post()
  @ApiOperation({
    summary:
      'Запросить AI-подсказку (только кандидат, сессия ACTIVE, лимит на сессию). Рассылается всем по WebSocket: hint:created',
  })
  request(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @CurrentUser() actor: JwtPayload,
    @Body() dto: RequestHintDto,
  ): Promise<SessionHintEntity> {
    return this.hintsService.request(sessionId, actor, dto);
  }
}
