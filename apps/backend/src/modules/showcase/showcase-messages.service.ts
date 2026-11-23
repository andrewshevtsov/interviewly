import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ShowcaseMessage } from '../../prisma/generated/client.ts';
import { ShowcaseResponseStatus } from '../../prisma/generated/enums.ts';
import { ShowcaseMessageResponse, ShowcaseUnreadMessages } from './entities/showcase-message.entity.ts';
import { findLinks } from '../../shared/utils/links.ts';
import { ShowcaseMessagesRepository } from './showcase-messages.repository.ts';
import { MESSAGE_RATE_LIMIT, MESSAGE_RATE_WINDOW_SECONDS } from './showcase.constants.ts';

// Чат доступен, когда владелец принял или отклонил отклик
const CHAT_STATUSES: ShowcaseResponseStatus[] = [ShowcaseResponseStatus.ACCEPTED, ShowcaseResponseStatus.REJECTED];

/**
 * Переписка двух участников отклика: договориться о деталях встречи. клиент опрашивает список.
 */
@Injectable()
export class ShowcaseMessagesService {
  constructor(private readonly repository: ShowcaseMessagesRepository) {}

  async list(userId: string, responseId: string): Promise<ShowcaseMessageResponse[]> {
    await this.requireChat(userId, responseId);
    const rows = await this.repository.findRecent(responseId);
    return rows.map((row) => this.toResponse(row, userId));
  }

  async send(userId: string, responseId: string, text: string): Promise<ShowcaseMessageResponse> {
    await this.requireChat(userId, responseId);
    await this.requireSendQuota(userId);
    const created = await this.repository.create({ responseId, senderId: userId, text });
    return this.toResponse(created, userId);
  }

  /** Непрочитанные сообщения по моим откликам: опрос раз в 2 минуты */
  async unread(userId: string): Promise<ShowcaseUnreadMessages[]> {
    const rows = await this.repository.countUnread(userId);
    return rows.map(
      (row) => new ShowcaseUnreadMessages({ responseId: row.responseId, count: row.count, box: row.owner ? 'incoming' : 'outgoing' }),
    );
  }

  /** Отмечает чат прочитанным: сообщения собеседника до этого момента больше не считаются */
  async markRead(userId: string, responseId: string): Promise<void> {
    await this.requireChat(userId, responseId);
    await this.repository.markRead(responseId, userId);
  }

  private async requireChat(userId: string, responseId: string): Promise<void> {
    const response = await this.repository.findResponse(responseId);
    if (!response) {
      throw new NotFoundException('Response not found');
    }
    if (userId !== response.responderId && userId !== response.card.userId) {
      throw new ForbiddenException('Only the participants of a response can use its chat');
    }
    if (!CHAT_STATUSES.includes(response.status)) {
      throw new ConflictException('The chat opens after the card owner accepts or rejects the response');
    }
  }

  private async requireSendQuota(userId: string): Promise<void> {
    const since = new Date(Date.now() - MESSAGE_RATE_WINDOW_SECONDS * 1000);
    const sent = await this.repository.countSentSince(userId, since);
    if (sent >= MESSAGE_RATE_LIMIT) {
      throw new HttpException(
        `Too many messages: at most ${MESSAGE_RATE_LIMIT} per ${MESSAGE_RATE_WINDOW_SECONDS} seconds`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private toResponse(message: ShowcaseMessage, userId: string): ShowcaseMessageResponse {
    return new ShowcaseMessageResponse({
      id: message.id,
      text: message.text,
      createdAt: message.createdAt,
      mine: message.senderId === userId,
      linkHosts: findLinks(message.text),
    });
  }
}
