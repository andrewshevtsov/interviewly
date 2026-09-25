import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.ts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import { CreateAccessRequestDto } from './dto/create-access-request.dto.ts';
import { CreateSessionDto } from './dto/create-session.dto.ts';
import { JoinSessionDto } from './dto/join-session.dto.ts';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto.ts';
import {
  LivekitTokenResponse,
  MySessionStateResponse,
  SessionAccessRequestEntity,
  SessionEntity,
  SessionParticipantsResponse,
} from './entities/session.entity.ts';
import { SESSION_PERMISSIONS } from './sessions.permissions.ts';
import { SessionsService } from './sessions.service.ts';

@ApiTags('sessions')
@Controller('sessions')
@UseInterceptors(ClassSerializerInterceptor)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Матрица прав сессий (из sessions.permissions.ts)',
  })
  permissions() {
    return SESSION_PERMISSIONS;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать сессию (создатель = владелец, в комнате - INTERVIEWER)' })
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSessionDto,
  ): Promise<SessionEntity> {
    return this.sessionsService.create(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Сессии текущего пользователя (owner / участник / pending-заявка). Admin — все.',
  })
  findAll(@CurrentUser() actor: JwtPayload): Promise<SessionEntity[]> {
    return this.sessionsService.findAll(actor);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Карточка сессии без списка участников' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<SessionEntity> {
    return this.sessionsService.findOne(id, actor);
  }

  @Get(':id/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Моё состояние в комнате: роль участника и статус последней заявки',
  })
  getMyState(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<MySessionStateResponse> {
    return this.sessionsService.getMyState(id, userId);
  }

  @Get(':id/participants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Участники и count - только владелец / участники комнаты / admin',
  })
  listParticipants(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<SessionParticipantsResponse> {
    return this.sessionsService.listParticipants(id, actor);
  }

  @Post(':id/access-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Заявка на вход (OPEN/PASSWORD). Принимает только владелец.',
  })
  createAccessRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
    @Body() dto: CreateAccessRequestDto,
  ): Promise<SessionAccessRequestEntity> {
    return this.sessionsService.createAccessRequest(id, actor, dto);
  }

  @Get(':id/access-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список заявок - только владелец / admin' })
  listAccessRequests(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<SessionAccessRequestEntity[]> {
    return this.sessionsService.listAccessRequests(id, actor);
  }

  @Post(':id/access-requests/:requestId/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Одобрить заявку (владелец)' })
  approveAccessRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<SessionAccessRequestEntity> {
    return this.sessionsService.approveAccessRequest(id, requestId, actor);
  }

  @Post(':id/access-requests/:requestId/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Отклонить заявку (владелец)' })
  rejectAccessRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<SessionAccessRequestEntity> {
    return this.sessionsService.rejectAccessRequest(id, requestId, actor);
  }

  @Post(':id/transfer-ownership')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Передать владение другому интервьюеру сессии (владелец / admin)',
  })
  transferOwnership(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
    @Body() dto: TransferOwnershipDto,
  ): Promise<SessionEntity> {
    return this.sessionsService.transferOwnership(id, actor, dto);
  }

  @Post(':id/end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Завершить интервью для всех и закрыть LiveKit-комнату (владелец / admin)',
  })
  end(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<SessionEntity> {
    return this.sessionsService.end(id, actor);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Повторный вход уже принятого участника (отключает от других комнат)',
  })
  join(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: JoinSessionDto,
  ): Promise<SessionEntity> {
    return this.sessionsService.join(id, userId, dto);
  }

  @Post(':id/livekit-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'LiveKit JWT для участника; отключает от предыдущей активной комнаты',
  })
  createLivekitToken(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<LivekitTokenResponse> {
    return this.sessionsService.createLivekitToken(id, userId);
  }
}
