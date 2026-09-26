import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FeedbackRepository } from './feedback.repository.ts';
import { SessionParticipantRole } from '../../prisma/generated/enums.ts';
import type { CreateFeedbackDto } from './dto/create-feedback.ts';
import type { UpdateFeedbackDto } from './dto/update-feedback.ts';

@Injectable()
export class FeedbackService {
  constructor(private readonly feedbackRepository: FeedbackRepository) { }

  async create(sessionId: string, authorId: string, dto: CreateFeedbackDto) {
    if (dto.targetUserId === authorId) {
      throw new BadRequestException('Cannot leave feedback about yourself');
    }

    const authorRole = await this.feedbackRepository.findParticipantRole(sessionId, authorId);
    if (!authorRole) {
      throw new ForbiddenException('You did not participate in this session');
    }
    if (authorRole !== SessionParticipantRole.INTERVIEWER) {
      throw new ForbiddenException('Only the interviewer can leave feedback');
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

  findMine(authorId: string) {
    return this.feedbackRepository.findManyByAuthor(authorId);
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
    const requesterRole = await this.feedbackRepository.findParticipantRole(sessionId, requesterId);
    if (!requesterRole) {
      throw new ForbiddenException('You did not participate in this session');
    }
    if (requesterRole !== SessionParticipantRole.INTERVIEWER) {
      throw new ForbiddenException('Only the interviewer can leave feedback');
    }

    const others = await this.feedbackRepository.findOtherParticipants(sessionId, requesterId);
    return others.map(({ user }) => ({
      userId: user.id,
      name: user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName,
    }));
  }
}
