import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.ts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { CreateShowcaseMessageDto } from './dto/create-showcase-message.dto.ts';
import { ShowcaseMessageResponse, ShowcaseUnreadMessages } from './entities/showcase-message.entity.ts';
import { ShowcaseMessagesService } from './showcase-messages.service.ts';

@ApiTags('showcase')
@Controller('showcase/responses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShowcaseMessagesController {
  constructor(private readonly messagesService: ShowcaseMessagesService) {}

  @Get('unread-messages')
  @ApiOperation({ summary: 'Непрочитанные сообщения собеседников по моим откликам (только отклики с непрочитанным)' })
  unread(@CurrentUser('sub') userId: string): Promise<ShowcaseUnreadMessages[]> {
    return this.messagesService.unread(userId);
  }

  @Get(':id/messages')
  @ApiOperation({
    summary: 'Чат по отклику: последние сообщения по порядку (после решения владельца; только два участника)',
  })
  list(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ShowcaseMessageResponse[]> {
    return this.messagesService.list(userId, id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Написать в чат отклика (после решения владельца; только два участника)' })
  send(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateShowcaseMessageDto,
  ): Promise<ShowcaseMessageResponse> {
    return this.messagesService.send(userId, id, dto.text);
  }

  @Post(':id/messages/read')
  @HttpCode(204)
  @ApiOperation({ summary: 'Отметить чат прочитанным: сбрасывает счётчик непрочитанных' })
  markRead(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.messagesService.markRead(userId, id);
  }
}
