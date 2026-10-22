import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import type { ProfileRepository } from './profile.repository.ts';
import { ProfessionLevel, type CreateProfileDto } from './dto/create-profile.dto.ts';
import { ProfileService } from './profile.service.ts';

const dto: CreateProfileDto = {
  role: 'Backend Engineer',
  level: ProfessionLevel.senior,
  stack: ['NestJS'],
  bio: 'bio',
};

describe('ProfileService', () => {
  let repository: Mocked<ProfileRepository>;
  let service: ProfileService;

  beforeEach(() => {
    repository = {
      findByUserId: vi.fn(),
      upsertByUserId: vi.fn(),
    } as unknown as Mocked<ProfileRepository>;
    service = new ProfileService(repository);
  });

  it('возвращает null, если пользователь ещё не заполнял профиль', async () => {
    repository.findByUserId.mockResolvedValue(null);

    await expect(service.findByUserId('user')).resolves.toBeNull();
    expect(repository.findByUserId).toHaveBeenCalledWith('user');
  });

  it('сохраняет анкету под userId из токена', async () => {
    repository.upsertByUserId.mockResolvedValue({ id: 'p', userId: 'user', ...dto } as never);

    await service.upsertByUserId('user', dto);

    expect(repository.upsertByUserId).toHaveBeenCalledWith('user', dto);
  });

  it('не даёт включить витрину без стека или роли', async () => {
    await expect(
      service.upsertByUserId('user', { ...dto, stack: [], showcaseVisible: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.upsertByUserId('user', { ...dto, role: '  ', showcaseVisible: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.upsertByUserId).not.toHaveBeenCalled();
  });

  it('разрешает скрыть витрину и с пустым стеком', async () => {
    repository.upsertByUserId.mockResolvedValue({} as never);

    await service.upsertByUserId('user', { ...dto, stack: [], showcaseVisible: false });

    expect(repository.upsertByUserId).toHaveBeenCalled();
  });
});
