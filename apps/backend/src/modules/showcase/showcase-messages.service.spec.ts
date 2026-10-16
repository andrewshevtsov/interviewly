import { ConflictException, ForbiddenException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { CreateShowcaseMessageDto } from './dto/create-showcase-message.dto.ts';
import type { ShowcaseMessagesRepository } from './showcase-messages.repository.ts';
import { ShowcaseMessagesService } from './showcase-messages.service.ts';

const chat = (status: string) => ({ id: 'r', status, responderId: 'responder', card: { userId: 'owner' } });

describe('ShowcaseMessagesService', () => {
  let repository: Mocked<ShowcaseMessagesRepository>;
  let service: ShowcaseMessagesService;

  beforeEach(() => {
    repository = {
      findResponse: vi.fn().mockResolvedValue(chat('ACCEPTED')),
      findRecent: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      countUnread: vi.fn(),
      markRead: vi.fn(),
    } as unknown as Mocked<ShowcaseMessagesRepository>;
    service = new ShowcaseMessagesService(repository);
  });

  it.each(['responder', 'owner'])('участник %s читает чат и видит свои сообщения как mine', async (userId) => {
    repository.findRecent.mockResolvedValue([
      { id: 'm1', senderId: 'responder', text: 'Привет', createdAt: new Date(0) },
      { id: 'm2', senderId: 'owner', text: 'Здравствуйте', createdAt: new Date(1) },
    ] as never);

    const messages = await service.list(userId, 'r');

    expect(messages.map((message) => message.mine)).toEqual(userId === 'responder' ? [true, false] : [false, true]);
    expect(JSON.stringify(messages)).not.toContain('senderId');
  });

  it('чат открыт и после отказа', async () => {
    repository.findResponse.mockResolvedValue(chat('REJECTED') as never);

    await expect(service.list('owner', 'r')).resolves.toEqual([]);
  });

  it.each(['PENDING', 'CANCELLED', 'EXPIRED'])('при статусе %s чат закрыт: 409', async (status) => {
    repository.findResponse.mockResolvedValue(chat(status) as never);

    await expect(service.list('owner', 'r')).rejects.toBeInstanceOf(ConflictException);
    await expect(service.send('owner', 'r', 'hi')).rejects.toBeInstanceOf(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('посторонний не читает и не пишет: 403', async () => {
    await expect(service.list('stranger', 'r')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.send('stranger', 'r', 'hi')).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('несуществующий отклик: 404', async () => {
    repository.findResponse.mockResolvedValue(null);

    await expect(service.list('owner', 'r')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('сохраняет сообщение от лица отправителя', async () => {
    repository.create.mockResolvedValue({ id: 'm', senderId: 'owner', text: 'hi', createdAt: new Date(0) } as never);

    const sent = await service.send('owner', 'r', 'hi');

    expect(repository.create).toHaveBeenCalledWith({ responseId: 'r', senderId: 'owner', text: 'hi' });
    expect(sent).toMatchObject({ text: 'hi', mine: true });
  });
});

describe('ShowcaseMessagesService: непрочитанные', () => {
  let repository: Mocked<ShowcaseMessagesRepository>;
  let service: ShowcaseMessagesService;

  beforeEach(() => {
    repository = {
      findResponse: vi.fn().mockResolvedValue(chat('ACCEPTED')),
      countUnread: vi.fn(),
      markRead: vi.fn(),
    } as unknown as Mocked<ShowcaseMessagesRepository>;
    service = new ShowcaseMessagesService(repository);
  });

  it('отдаёт счётчики по откликам и сторону: входящие - я владелец карточки, исходящие - я откликался', async () => {
    repository.countUnread.mockResolvedValue([
      { responseId: 'a', count: 2, owner: true },
      { responseId: 'b', count: 1, owner: false },
    ]);

    await expect(service.unread('me')).resolves.toEqual([
      { responseId: 'a', count: 2, box: 'incoming' },
      { responseId: 'b', count: 1, box: 'outgoing' },
    ]);
  });

  it('отмечает чат прочитанным только участнику', async () => {
    await service.markRead('owner', 'r');
    expect(repository.markRead).toHaveBeenCalledWith('r', 'owner');

    await expect(service.markRead('stranger', 'r')).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('CreateShowcaseMessageDto', () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const parse = (body: object) => pipe.transform(body, { type: 'body', metatype: CreateShowcaseMessageDto });

  it('обрезает пробелы и принимает до 1000 символов', async () => {
    await expect(parse({ text: '  привет  ' })).resolves.toMatchObject({ text: 'привет' });
    await expect(parse({ text: 'а'.repeat(1000) })).resolves.toBeDefined();
  });

  it.each([{ text: '   ' }, { text: 'а'.repeat(1001) }, {}, { text: 'ok', senderId: 'x' }])(
    'отклоняет %j',
    async (body) => {
      await expect(parse(body)).rejects.toThrow();
    },
  );
});
