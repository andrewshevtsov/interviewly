import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../../infrastructure/email/email.service.ts';
import { Prisma } from '../../prisma/generated/client.ts';
import { EMAIL_CHANGE_CONFIRM_PATH, EMAIL_CHANGE_TOKEN_BYTES, EMAIL_CHANGE_TTL_HOURS } from './email-change.constants.ts';
import { EmailChangeRepository } from './email-change.repository.ts';
import { UsersRepository } from './users.repository.ts';
import { TELEGRAM_PLACEHOLDER_EMAIL_DOMAIN } from './users.constants.ts';

const HOUR_MS = 60 * 60 * 1000;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export interface PendingEmailChange {
  newEmail: string;
  expiresAt: Date;
}

/**
 * Смена email с подтверждением: адрес меняется только после перехода по ссылке из письма на новый адрес.
 */
@Injectable()
export class EmailChangeService {
  private readonly logger = new Logger(EmailChangeService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly requests: EmailChangeRepository,
    private readonly users: UsersRepository,
    private readonly emailService: EmailService,
    configService: ConfigService,
  ) {
    this.frontendUrl = (configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  async request(userId: string, input: { email: string; password?: string }): Promise<PendingEmailChange> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException(`User "${userId}" not found`);
    }

    // Пароль спрашиваем только у тех, у кого он есть: вошедший через Telegram подтверждает почту одним письмом
    if (user.passwordHash) {
      const matches = input.password ? await bcrypt.compare(input.password, user.passwordHash) : false;
      if (!matches) {
        throw new ForbiddenException('Invalid password');
      }
    }

    const newEmail = input.email;
    if (newEmail.endsWith(`@${TELEGRAM_PLACEHOLDER_EMAIL_DOMAIN}`)) {
      throw new BadRequestException('This email domain is reserved');
    }
    if (newEmail === user.email.toLowerCase()) {
      throw new BadRequestException('This is already your email');
    }
    if (await this.requests.findUserByEmailInsensitive(newEmail)) {
      throw new ConflictException('This email is already used by another account');
    }

    const token = randomBytes(EMAIL_CHANGE_TOKEN_BYTES).toString('base64url');
    const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TTL_HOURS * HOUR_MS);
    await this.requests.upsert(userId, { newEmail, tokenHash: hashToken(token), expiresAt });

    try {
      await this.emailService.send({
        to: newEmail,
        subject: 'Подтвердите новый email в Interviewly',
        text: [
          `Здравствуйте, ${user.firstName}!`,
          'Чтобы привязать этот адрес к аккаунту Interviewly, перейдите по ссылке:',
          `${this.frontendUrl}${EMAIL_CHANGE_CONFIRM_PATH}?token=${token}`,
          `Ссылка действует ${EMAIL_CHANGE_TTL_HOURS} часа. Если вы ничего не меняли, просто проигнорируйте письмо.`,
        ].join('\n'),
      });
    } catch (error: unknown) {
      await this.requests.deleteByUserId(userId);
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Could not send email change confirmation: ${reason}`);
      throw new ServiceUnavailableException('Could not send the confirmation email, try again later');
    }

    return { newEmail, expiresAt };
  }

  async findPending(userId: string): Promise<PendingEmailChange | null> {
    const request = await this.requests.findByUserId(userId);
    if (!request || request.expiresAt <= new Date()) {
      return null;
    }
    return { newEmail: request.newEmail, expiresAt: request.expiresAt };
  }

  async cancel(userId: string): Promise<void> {
    await this.requests.deleteByUserId(userId);
  }

  async confirm(token: string): Promise<{ email: string }> {
    const request = await this.requests.findByTokenHash(hashToken(token));
    if (!request || request.expiresAt <= new Date()) {
      throw new BadRequestException('The confirmation link is invalid or has expired');
    }

    try {
      const user = await this.requests.applyChange(request);
      return { email: user.email };
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This email is already used by another account');
      }
      throw error;
    }
  }
}
