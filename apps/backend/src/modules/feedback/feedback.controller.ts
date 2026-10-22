import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service.ts';
import { CreateFeedbackDto } from './dto/create-feedback.ts';
import { UpdateFeedbackDto } from './dto/update-feedback.ts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { CurrentUser } from '../auth/decorators/current-user.decorator.ts';

@Controller()
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) { }

  @Post('sessions/:sessionId/feedback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiProperty()
  create(
    @Param('sessionId') sessionId: string,
    @CurrentUser('sub') authorId: string,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.create(sessionId, authorId, dto);
  }

  // Пока модуля sessions нет, это единственный способ фронту узнать, кому
  // из участников сессии реально можно оставить отзыв (без себя и без чужих).
  @Get('sessions/:sessionId/feedback/participants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiProperty()
  findEligibleTargets(@Param('sessionId') sessionId: string, @CurrentUser('sub') requesterId: string) {
    return this.feedbackService.findEligibleTargets(sessionId, requesterId);
  }

  // "me"-маршрут объявлен в отдельном контроллере пути `/feedback`, а не
  // как вложенный под `/sessions/:sessionId`, — история отзывов читается
  // сразу по всем сессиям автора.
  @Get('feedback/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiProperty()
  findMine(@CurrentUser('sub') authorId: string) {
    return this.feedbackService.findMine(authorId);
  }

  @Get('feedback/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiProperty()
  findOne(@Param('id') id: string, @CurrentUser('sub') requesterId: string) {
    return this.feedbackService.findOne(id, requesterId);
  }

  @Patch('feedback/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiProperty()
  update(
    @Param('id') id: string,
    @CurrentUser('sub') requesterId: string,
    @Body() dto: UpdateFeedbackDto,
  ) {
    return this.feedbackService.update(id, requesterId, dto);
  }
}
