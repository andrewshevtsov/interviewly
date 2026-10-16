import { NotFoundException, ValidationPipe } from '@nestjs/common';
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
