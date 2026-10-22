import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.ts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import { SetEditorOpenDto } from './dto/set-editor-open.dto.ts';
import { SessionEditorStateResponse } from './entities/session.entity.ts';
import { SessionEditorService } from './session-editor.service.ts';

@ApiTags('sessions')
@Controller('sessions/:id/editor')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionEditorController {
  constructor(private readonly editorService: SessionEditorService) {}

  @Put()
  @ApiOperation({
    summary:
      'Открыть / закрыть редактор кода в комнате (интервьюер). Рассылается всем по WebSocket: editor:toggled',
  })
  setOpen(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @CurrentUser() actor: JwtPayload,
    @Body() dto: SetEditorOpenDto,
  ): Promise<SessionEditorStateResponse> {
    return this.editorService.setOpen(sessionId, actor, dto.open);
  }
}
