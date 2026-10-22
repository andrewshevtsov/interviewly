import { ConflictException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import type { UsersRepository } from './users.repository.ts';
import { UsersService } from './users.service.ts';
import { UpdateMeDto } from './dto/update-me.dto.ts';

describe('UsersService.updateMe', () => {
  let repository: Mocked<UsersRepository>;
  let service: UsersService;

  beforeEach(() => {
    repository = {
      findById: vi.fn(),
      update: vi.fn(),
    } as unknown as Mocked<UsersRepository>;
    service = new UsersService(repository);
  });

  it('обновляет разрешённые поля существующего пользователя', async () => {
    repository.findById.mockResolvedValue({ id: 'u' } as never);
    repository.update.mockResolvedValue({ id: 'u', firstName: 'Ivan' } as never);

    const user = await service.updateMe('u', { firstName: 'Ivan' });

    expect(repository.update).toHaveBeenCalledWith('u', { firstName: 'Ivan' });
    expect(user.firstName).toBe('Ivan');
  });

  it('отвечает 404, если пользователя нет', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.updateMe('u', { firstName: 'Ivan' })).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('UpdateMeDto', () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const validate = (body: object) =>
    pipe.transform(body, { type: 'body', metatype: UpdateMeDto });

  it.each(['isAdmin', 'status', 'passwordHash', 'email', 'telegramId'])(
    'отклоняет поле %s, которое нельзя менять самому',
    async (field) => {
      await expect(validate({ [field]: 'x' })).rejects.toThrow();
    },
  );

  it('очищает фамилию и ник пустой строкой', async () => {
    const dto: unknown = await validate({ lastName: '  ', telegramUsername: '' });

    expect(dto).toMatchObject({ lastName: null, telegramUsername: null });
  });

  it('приводит ник к виду без @ и пробелов', async () => {
    await expect(validate({ telegramUsername: ' @Ivan_Petrov ' })).resolves.toMatchObject({
      telegramUsername: 'Ivan_Petrov',
    });
  });

  it.each(['abcd', 'has space', 'кириллица', 'a'.repeat(33)])('отклоняет некорректный ник %s', async (name) => {
    await expect(validate({ telegramUsername: name })).rejects.toThrow();
  });

  it('принимает имя, фамилию и часовой пояс', async () => {
    await expect(
      validate({ firstName: 'Ivan', lastName: 'Petrov', timeZone: 'Europe/Moscow' }),
    ).resolves.toBeInstanceOf(UpdateMeDto);
  });
});

describe('UserEntity', () => {
  it('отдаёт hasPassword, но не passwordHash', async () => {
    const { instanceToPlain } = await import('class-transformer');
    const { UserEntity } = await import('./entities/user-entity.ts');

    const withPassword = instanceToPlain(new UserEntity({ id: 'u', passwordHash: 'secret' }));
    const withoutPassword = instanceToPlain(new UserEntity({ id: 'u', passwordHash: null }));

    expect(withPassword).toMatchObject({ hasPassword: true });
    expect(withPassword).not.toHaveProperty('passwordHash');
    expect(withoutPassword).toMatchObject({ hasPassword: false });
  });
});

describe('UsersService.unlinkTelegram', () => {
  let repository: Mocked<UsersRepository>;
  let service: UsersService;

  beforeEach(() => {
    repository = { findById: vi.fn(), update: vi.fn() } as unknown as Mocked<UsersRepository>;
    service = new UsersService(repository);
  });

  it('сбрасывает привязку у пользователя с настоящим email', async () => {
    repository.findById.mockResolvedValue({ id: 'u', email: 'a@b.com' } as never);
    repository.update.mockResolvedValue({ id: 'u', telegramId: null } as never);

    await service.unlinkTelegram('u');

    expect(repository.update).toHaveBeenCalledWith('u', {
      telegramId: null,
      telegramUsername: null,
      telegramLinkedAt: null,
    });
  });

  it('отвечает 409, если почта служебная: иначе аккаунт останется без входа', async () => {
    repository.findById.mockResolvedValue({ id: 'u', email: 'tg-1@telegram.interviewly.local' } as never);

    await expect(service.unlinkTelegram('u')).rejects.toBeInstanceOf(ConflictException);
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('UsersService.linkTelegram', () => {
  let repository: Mocked<UsersRepository>;
  let service: UsersService;

  beforeEach(() => {
    repository = { findByTelegramId: vi.fn(), update: vi.fn() } as unknown as Mocked<UsersRepository>;
    repository.findByTelegramId.mockResolvedValue(null);
    repository.update.mockResolvedValue({ id: 'u' } as never);
    service = new UsersService(repository);
  });

  it('сохраняет ник Telegram-аккаунта', async () => {
    await service.linkTelegram('u', { telegramId: '1', telegramUsername: 'new_nick' });

    expect(repository.update).toHaveBeenCalledWith('u', expect.objectContaining({ telegramUsername: 'new_nick' }));
  });

  it('стирает старый ник, если у нового аккаунта ника нет', async () => {
    await service.linkTelegram('u', { telegramId: '2' });

    expect(repository.update).toHaveBeenCalledWith('u', expect.objectContaining({ telegramUsername: null }));
  });
});
