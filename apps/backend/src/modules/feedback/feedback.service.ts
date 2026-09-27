import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FeedbackRepository } from './feedback.repository.ts';
import type { CreateFeedbackDto } from './dto/create-feedback.ts';
import type { UpdateFeedbackDto } from './dto/update-feedback.ts';

@Injectable()
export class FeedbackService {
  constructor(private readonly feedbackRepository: FeedbackRepository) { }

  async create(sessionId: string, authorId: string, dto: CreateFeedbackDto) {
    if (dto.targetUserId === authorId) {
      throw new BadRequestException('Cannot leave feedback about yourself');
    }

    const authorParticipated = await this.feedbackRepository.isSessionParticipant(sessionId, authorId);
    if (!authorParticipated) {
      throw new ForbiddenException('You did not participate in this session');
    }

    const targetParticipated = await this.feedbackRepository.isSessionParticipant(sessionId, dto.targetUserId);
    if (!targetParticipated) {
      throw new BadRequestException('Target user did not participate in this session');
    }

    const existing = await this.feedbackRepository.findUnique(sessionId, authorId, dto.targetUserId);
    if (existing) {
      throw new ConflictException('Feedback for this participant already exists, use update instead');
    }

    return this.feedbackRepository.create({
      sessionId,
      authorId,
      targetUserId: dto.targetUserId,
      score: dto.score,
      comment: dto.comment,
    });
  }

  async findMine(authorId: string) {
    const feedback = await this.feedbackRepository.findManyByAuthor(authorId);
    return feedback.map(({ targetUser, session, ...rest }) => ({
      ...rest,
      targetUser: { userId: targetUser.id, name: this.formatUserName(targetUser) },
      sessionType: session.type,
      sessionDate: session.endedAt ?? session.startedAt ?? session.scheduledAt,
    }));
  }

  async findOne(id: string, requesterId: string) {
    const feedback = await this.feedbackRepository.findById(id);
    if (!feedback) {
      throw new NotFoundException(`Feedback with id ${id} not found`);
    }
    if (feedback.authorId !== requesterId) {
      throw new ForbiddenException('You can only view your own feedback');
    }
    return feedback;
  }

  async update(id: string, requesterId: string, dto: UpdateFeedbackDto) {
    await this.findOne(id, requesterId);
    return this.feedbackRepository.update(id, dto);
  }

  async findEligibleTargets(sessionId: string, requesterId: string) {
    const requesterParticipated = await this.feedbackRepository.isSessionParticipant(sessionId, requesterId);
    if (!requesterParticipated) {
      throw new ForbiddenException('You did not participate in this session');
    }

    const others = await this.feedbackRepository.findOtherParticipants(sessionId, requesterId);
    return others.map(({ user }) => ({ userId: user.id, name: this.formatUserName(user) }));
  }

  private formatUserName(user: { firstName: string; lastName: string | null }) {
    return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
  }
}
