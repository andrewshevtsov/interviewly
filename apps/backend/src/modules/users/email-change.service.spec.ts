import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
  ForbiddenException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import type { EmailService } from '../../infrastructure/email/email.service.ts';
import { Prisma } from '../../prisma/generated/client.ts';
import { EmailChangeRepository } from './email-change.repository.ts';
import { EmailChangeService } from './email-change.service.ts';
import { UsersRepository } from './users.repository.ts';

const passwordHash = bcrypt.hashSync('Password123!', 4);
const baseUser = { id: 'u1', email: 'Old@Example.com', firstName: 'Ivan', passwordHash };

describe('EmailChangeService', () => {
  let requests: Mocked<EmailChangeRepository>;
  let users: Mocked<UsersRepository>;
  let emailService: Mocked<EmailService>;
  let service: EmailChangeService;

  beforeEach(() => {
    requests = {
      upsert: vi.fn(),
      findByUserId: vi.fn(),
      findByTokenHash: vi.fn(),
      deleteByUserId: vi.fn(),
      findUserByEmailInsensitive: vi.fn().mockResolvedValue(null),
      applyChange: vi.fn(),
    } as unknown as Mocked<EmailChangeRepository>;
    users = { findById: vi.fn().mockResolvedValue(baseUser) } as unknown as Mocked<UsersRepository>;
    emailService = { send: vi.fn().mockResolvedValue(undefined) } as unknown as Mocked<EmailService>;
    const config = { get: () => 'http://front.test/' } as unknown as ConfigService;
    service = new EmailChangeService(requests, users, emailService, config);
  });

  describe('request', () => {
    it('сохраняет только хэш токена и шлёт письмо со ссылкой на новый адрес', async () => {
      const result = await service.request('u1', { email: 'new@example.com', password: 'Password123!' });

      const stored = requests.upsert.mock.calls[0]![1];
      const message = emailService.send.mock.calls[0]![0];
      const token = new URL(message.text.match(/https?:\/\/\S+/)![0]).searchParams.get('token')!;

      expect(message.to).toBe('new@example.com');
      expect(message.text).toContain('http://front.test/confirm-email?token=');
      expect(stored.tokenHash).not.toContain(token);
      expect(stored.tokenHash).toHaveLength(64);
      expect(result.newEmail).toBe('new@example.com');
    });

    it('отклоняет неверный и отсутствующий пароль', async () => {
      await expect(service.request('u1', { email: 'new@example.com', password: 'wrong' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(service.request('u1', { email: 'new@example.com' })).rejects.toBeInstanceOf(ForbiddenException);
      expect(requests.upsert).not.toHaveBeenCalled();
    });

    it('не просит пароль у аккаунта без пароля (вход через Telegram)', async () => {
      users.findById.mockResolvedValue({ ...baseUser, passwordHash: null } as never);

      await expect(service.request('u1', { email: 'new@example.com' })).resolves.toMatchObject({
        newEmail: 'new@example.com',
      });
    });

    it('отклоняет свой текущий адрес, не глядя на регистр', async () => {
      await expect(
        service.request('u1', { email: 'old@example.com', password: 'Password123!' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('отклоняет служебный домен Telegram', async () => {
      await expect(
        service.request('u1', { email: 'tg-1@telegram.interviewly.local', password: 'Password123!' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('отвечает 409, если адрес занят другим аккаунтом', async () => {
      requests.findUserByEmailInsensitive.mockResolvedValue({ id: 'other' } as never);

      await expect(
        service.request('u1', { email: 'new@example.com', password: 'Password123!' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(requests.upsert).not.toHaveBeenCalled();
    });

    it('убирает запрос и отвечает 503, если письмо не ушло', async () => {
      emailService.send.mockRejectedValue(new Error('smtp down'));

      await expect(
        service.request('u1', { email: 'new@example.com', password: 'Password123!' }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(requests.deleteByUserId).toHaveBeenCalledWith('u1');
    });

    it('отвечает 404, если пользователя нет', async () => {
      users.findById.mockResolvedValue(null);

      await expect(service.request('u1', { email: 'new@example.com' })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findPending', () => {
    it('не показывает просроченный запрос', async () => {
      requests.findByUserId.mockResolvedValue({ newEmail: 'n@e.com', expiresAt: new Date(Date.now() - 1000) } as never);

      await expect(service.findPending('u1')).resolves.toBeNull();
    });

    it('возвращает действующий запрос', async () => {
      const expiresAt = new Date(Date.now() + 60_000);
      requests.findByUserId.mockResolvedValue({ newEmail: 'n@e.com', expiresAt } as never);

      await expect(service.findPending('u1')).resolves.toEqual({ newEmail: 'n@e.com', expiresAt });
    });
  });

  describe('confirm', () => {
    const valid = { id: 'r1', userId: 'u1', newEmail: 'new@example.com', expiresAt: new Date(Date.now() + 60_000) };

    it('меняет email и ищет запрос по хэшу токена', async () => {
      requests.findByTokenHash.mockResolvedValue(valid as never);
      requests.applyChange.mockResolvedValue({ email: 'new@example.com' } as never);

      await expect(service.confirm('secret-token')).resolves.toEqual({ email: 'new@example.com' });
      expect(requests.findByTokenHash.mock.calls[0]![0]).toHaveLength(64);
      expect(requests.findByTokenHash.mock.calls[0]![0]).not.toBe('secret-token');
    });

    it('отклоняет неизвестный и просроченный токен', async () => {
      requests.findByTokenHash.mockResolvedValueOnce(null);
      await expect(service.confirm('x')).rejects.toBeInstanceOf(BadRequestException);

      requests.findByTokenHash.mockResolvedValueOnce({ ...valid, expiresAt: new Date(Date.now() - 1) } as never);
      await expect(service.confirm('x')).rejects.toBeInstanceOf(BadRequestException);
      expect(requests.applyChange).not.toHaveBeenCalled();
    });

    it('отвечает 409, если адрес заняли, пока письмо лежало', async () => {
      requests.findByTokenHash.mockResolvedValue(valid as never);
      requests.applyChange.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }),
      );

      await expect(service.confirm('x')).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
