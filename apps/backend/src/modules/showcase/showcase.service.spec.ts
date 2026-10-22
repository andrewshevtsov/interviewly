import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { ValidationPipe } from '@nestjs/common';
import type { ShowcaseRepository, ShowcaseRow } from './showcase.repository.ts';
import { ShowcaseService } from './showcase.service.ts';
import { ShowcaseQueryDto } from './dto/showcase-query.dto.ts';
import { IncomingResponsesQueryDto } from './dto/incoming-responses-query.dto.ts';

const row = (overrides: Partial<ShowcaseRow> = {}): ShowcaseRow => ({
  id: 'card',
  role: 'Backend',
  level: 'senior',
  stack: ['NestJS'],
  bio: null,
  user: { firstName: 'Ivan', lastName: 'Petrov', _count: { sessionParticipations: 3 } },
  inSession: false,
  latestResponse: null,
  ...overrides,
});

const query = (overrides: Partial<ShowcaseQueryDto> = {}): ShowcaseQueryDto =>
  Object.assign(new ShowcaseQueryDto(), overrides);

describe('ShowcaseService', () => {
  let repository: Mocked<ShowcaseRepository>;
  let service: ShowcaseService;

  beforeEach(() => {
    repository = { findPage: vi.fn() } as unknown as Mocked<ShowcaseRepository>;
    service = new ShowcaseService(repository);
  });

  it('передаёт фильтры и смотрящего в репозиторий', async () => {
    repository.findPage.mockResolvedValue([]);

    await service.findPage('viewer', query({ level: ['junior'], stack: ['Go'], q: 'iv', limit: 5, cursor: 'c' }));

    expect(repository.findPage).toHaveBeenCalledWith({
      viewerId: 'viewer',
      levels: ['junior'],
      stack: ['Go'],
      query: 'iv',
      limit: 5,
      cursor: 'c',
    });
  });

  it('отдаёт nextCursor и обрезает лишнюю строку, если страниц больше', async () => {
    repository.findPage.mockResolvedValue([row({ id: 'a' }), row({ id: 'b' }), row({ id: 'c' })]);

    const page = await service.findPage('viewer', query({ limit: 2 }));

    expect(page.items.map((card) => card.id)).toEqual(['a', 'b']);
    expect(page.nextCursor).toBe('b');
  });

  it('nextCursor равен null на последней странице', async () => {
    repository.findPage.mockResolvedValue([row({ id: 'a' }), row({ id: 'b' })]);

    const page = await service.findPage('viewer', query({ limit: 2 }));

    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeNull();
  });

  it('склеивает имя с фамилией и не отдаёт контакты и оценки', async () => {
    repository.findPage.mockResolvedValue([
      row({ id: 'a' }),
      row({ id: 'b', user: { firstName: 'Clara', lastName: null, _count: { sessionParticipations: 0 } } }),
    ]);

    const { items } = await service.findPage('viewer', query());

    expect(items[0]?.name).toBe('Ivan Petrov');
    expect(items[1]?.name).toBe('Clara');
    expect(Object.keys(items[0] ?? {}).sort()).toEqual(
      ['bio', 'id', 'inSession', 'interviewsCount', 'level', 'myResponse', 'name', 'role', 'stack'],
    );
  });

  describe('myResponse: что мешает откликнуться снова', () => {
    const HOUR = 60 * 60 * 1000;
    const latest = (overrides: Partial<NonNullable<ShowcaseRow['latestResponse']>>) => ({
      status: 'PENDING' as const,
      scheduledAt: new Date(Date.now() + 24 * HOUR),
      reviewedAt: null,
      timeMismatch: false,
      sessionStatus: null,
      ...overrides,
    });
    const myResponseOf = async (latestResponse: ShowcaseRow['latestResponse']) => {
      repository.findPage.mockResolvedValue([row({ latestResponse })]);
      return (await service.findPage('viewer', query())).items[0]?.myResponse;
    };

    it('без откликов блокировки нет', async () => {
      await expect(myResponseOf(null)).resolves.toBeNull();
    });

    it('отклик в ожидании: ждём ответа', async () => {
      await expect(myResponseOf(latest({}))).resolves.toEqual({ status: 'PENDING', canRetryAt: null });
    });

    it('просроченный отклик в ожидании не мешает', async () => {
      await expect(myResponseOf(latest({ scheduledAt: new Date(Date.now() - HOUR) }))).resolves.toBeNull();
    });

    it('после отказа действует пауза 48 часов и отдаётся дата её конца', async () => {
      const reviewedAt = new Date(Date.now() - HOUR);
      const mine = await myResponseOf(latest({ status: 'REJECTED', reviewedAt }));

      expect(mine).toEqual({ status: 'REJECTED', canRetryAt: new Date(reviewedAt.getTime() + 48 * HOUR) });
    });

    it('пауза кончилась или отказ из-за времени: блокировки нет', async () => {
      await expect(
        myResponseOf(latest({ status: 'REJECTED', reviewedAt: new Date(Date.now() - 49 * HOUR) })),
      ).resolves.toBeNull();
      await expect(
        myResponseOf(latest({ status: 'REJECTED', reviewedAt: new Date(Date.now() - HOUR), timeMismatch: true })),
      ).resolves.toBeNull();
    });

    it.each(['CANCELLED', 'EXPIRED'] as const)('статус %s не блокирует повтор', async (status) => {
      await expect(myResponseOf(latest({ status }))).resolves.toBeNull();
    });

    it.each(['SCHEDULED', 'READY', 'ACTIVE'] as const)(
      'принятый отклик с действующей встречей (сессия %s) блокирует повтор',
      async (sessionStatus) => {
        await expect(myResponseOf(latest({ status: 'ACCEPTED', sessionStatus }))).resolves.toEqual({
          status: 'ACCEPTED',
          canRetryAt: null,
        });
      },
    );

    it.each(['CANCELLED', 'COMPLETED'] as const)(
      'принятый отклик, чья встреча %s, не блокирует повтор',
      async (sessionStatus) => {
        await expect(myResponseOf(latest({ status: 'ACCEPTED', sessionStatus }))).resolves.toBeNull();
      },
    );
  });
});

describe('ShowcaseQueryDto', () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const parse = (value: object) => pipe.transform(value, { type: 'query', metatype: ShowcaseQueryDto });

  it('приводит одиночные значения stack и level к массивам, limit по умолчанию 20', async () => {
    const parsed = (await parse({ stack: 'Go', level: 'junior' })) as ShowcaseQueryDto;

    expect(parsed).toMatchObject({ stack: ['go'], level: ['junior'], limit: 20 });
  });

  it('регистр в stack и level не важен: React = react = REACT, SENIOR = senior', async () => {
    const parsed = (await parse({ stack: ['React', 'NODE.JS', ' go '], level: ['SENIOR', 'Junior'] })) as ShowcaseQueryDto;

    expect(parsed.stack).toEqual(['react', 'node.js', 'go']);
    expect(parsed.level).toEqual(['senior', 'junior']);
  });

  it('неизвестный уровень отклоняется и в другом регистре', async () => {
    await expect(parse({ level: 'PRINCIPAL' })).rejects.toThrow();
  });

  it.each([
    { level: 'principal' },
    { limit: '0' },
    { limit: '51' },
    { cursor: 'not-a-uuid' },
  ])('отклоняет некорректный запрос %j', async (bad) => {
    await expect(parse(bad)).rejects.toThrow();
  });
});

describe('IncomingResponsesQueryDto', () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const parse = (value: object) => pipe.transform(value, { type: 'query', metatype: IncomingResponsesQueryDto });

  it('статус принимается в любом регистре', async () => {
    await expect(parse({ status: 'pending' })).resolves.toMatchObject({ status: 'PENDING' });
    await expect(parse({ status: 'Rejected' })).resolves.toMatchObject({ status: 'REJECTED' });
  });

  it('неизвестный статус отклоняется', async () => {
    await expect(parse({ status: 'bad' })).rejects.toThrow();
  });
});
