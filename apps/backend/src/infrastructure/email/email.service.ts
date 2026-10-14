import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

// По умолчанию - Mailpit из docker-compose: в dev-режиме письма наружу не уходят
const DEFAULT_SMTP_HOST = 'localhost';
const DEFAULT_SMTP_PORT = 1025;
const DEFAULT_MAIL_FROM = 'Interviewly <no-reply@interviewly.local>';
const SMTPS_PORT = 465;

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(configService: ConfigService) {
    const port = Number(configService.get<string>('SMTP_PORT') ?? DEFAULT_SMTP_PORT);
    const user = configService.get<string>('SMTP_USER');
    const pass = configService.get<string>('SMTP_PASSWORD');

    this.from = configService.get<string>('MAIL_FROM') ?? DEFAULT_MAIL_FROM;
    this.transporter = createTransport({
      host: configService.get<string>('SMTP_HOST') ?? DEFAULT_SMTP_HOST,
      port,
      secure: port === SMTPS_PORT,
      auth: user ? { user, pass } : undefined,
    });
  }

  /** Бросаем ошибку при сбое SMTP, очередь повторяет доставку */
  async send(message: { to: string; subject: string; text: string }): Promise<void> {
    await this.transporter.sendMail({ from: this.from, ...message });
  }
}
