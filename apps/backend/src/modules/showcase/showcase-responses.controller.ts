import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateShowcaseResponseDto } from './dto/create-showcase-response.dto.ts';
import { IncomingResponsesQueryDto } from './dto/incoming-responses-query.dto.ts';
import { RejectShowcaseResponseDto } from './dto/reject-showcase-response.dto.ts';
import {
  ShowcaseIncomingResponse,
  ShowcaseOutgoingResponse,
  ShowcaseResponseResult,
} from './entities/showcase-response.entity.ts';
import { ShowcaseResponsesService } from './showcase-responses.service.ts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { CurrentUser } from '../auth/decorators/current-user.decorator.ts';

@ApiTags('showcase')
@Controller('showcase')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShowcaseResponsesController {
  constructor(private readonly responsesService: ShowcaseResponsesService) {}

  @Post('cards/:cardId/responses')
  @ApiOperation({
    summary:
      'Откликнуться на карточку, выбрав роль и время встречи. Один отклик в ожидании на карточку; слот не должен пересекаться с назначенными интервью; после отказа повтор через 48 часов (сразу, если отказ из-за времени)',
  })
  respond(
    @CurrentUser('sub') userId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Body() dto: CreateShowcaseResponseDto,
  ): Promise<ShowcaseResponseResult> {
    return this.responsesService.respond(userId, cardId, dto);
  }

  @Get('responses/incoming')
  @ApiOperation({ summary: 'Отклики на мою карточку: кто откликнулся и в какой роли' })
  findIncoming(
    @CurrentUser('sub') userId: string,
    @Query() query: IncomingResponsesQueryDto,
  ): Promise<ShowcaseIncomingResponse[]> {
    return this.responsesService.findIncoming(userId, query.status);
  }

  @Get('responses/outgoing')
  @ApiOperation({ summary: 'Мои отклики на чужие карточки: статус и причина отказа' })
  findOutgoing(@CurrentUser('sub') userId: string): Promise<ShowcaseOutgoingResponse[]> {
    return this.responsesService.findOutgoing(userId);
  }

  @Post('responses/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Принять отклик и создать сессию на предложенное время (только владелец карточки)',
  })
  accept(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ShowcaseResponseResult> {
    return this.responsesService.accept(userId, id);
  }

  @Post('responses/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Отклонить отклик с обязательной причиной 100-500 символов' })
  reject(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectShowcaseResponseDto,
  ): Promise<ShowcaseResponseResult> {
    return this.responsesService.reject(userId, id, dto);
  }

  @Post('responses/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Отозвать свой отклик, пока он в ожидании' })
  cancel(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ShowcaseResponseResult> {
    return this.responsesService.cancel(userId, id);
  }
}
