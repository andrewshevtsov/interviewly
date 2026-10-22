import { Body, Controller, Delete, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.ts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { ConfirmEmailChangeDto } from './dto/confirm-email-change.dto.ts';
import { RequestEmailChangeDto } from './dto/request-email-change.dto.ts';
import { EmailChangeService, type PendingEmailChange } from './email-change.service.ts';

@Controller('users')
export class EmailChangeController {
  constructor(private readonly emailChange: EmailChangeService) {}

  /** Отправляет письмо со ссылкой на новый адрес; прежний запрос заменяется */
  @Post('me/email-change')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  request(@CurrentUser('sub') userId: string, @Body() dto: RequestEmailChangeDto): Promise<PendingEmailChange> {
    return this.emailChange.request(userId, dto);
  }

  @Get('me/email-change')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findPending(@CurrentUser('sub') userId: string): Promise<{ pending: PendingEmailChange | null }> {
    return { pending: await this.emailChange.findPending(userId) };
  }

  @Delete('me/email-change')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  cancel(@CurrentUser('sub') userId: string): Promise<void> {
    return this.emailChange.cancel(userId);
  }

  @Post('email-change/confirm')
  @HttpCode(200)
  confirm(@Body() dto: ConfirmEmailChangeDto): Promise<{ email: string }> {
    return this.emailChange.confirm(dto.token);
  }
}
