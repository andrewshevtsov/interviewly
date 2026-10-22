import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FeedbackService } from './feedback.service.ts';
import { FeedbackController } from './feedback.controller.ts';
import { FeedbackRepository } from './feedback.repository.ts';
import { PrismaModule } from '../../prisma/prisma.module.ts';
import { AuthModule } from '../auth/auth.module.ts';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackRepository, JwtService],
  exports: [FeedbackService],
})
export class FeedbackModule { }
