import { Injectable } from '@nestjs/common';
import {
  ShowcaseCardResponse,
  ShowcaseMyResponse,
  ShowcasePageResponse,
} from './entities/showcase-card.entity.ts';
import { hasActiveMeeting, retryAfterRejection } from './showcase-rules.ts';
import { ShowcaseRepository, type LatestResponse, type ShowcaseRow } from './showcase.repository.ts';
import type { ShowcaseQueryDto } from './dto/showcase-query.dto.ts';

@Injectable()
export class ShowcaseService {
  constructor(private readonly repository: ShowcaseRepository) {}

  async findPage(viewerId: string, query: ShowcaseQueryDto): Promise<ShowcasePageResponse> {
    const rows = await this.repository.findPage({
      viewerId,
      levels: query.level,
      stack: query.stack,
      query: query.q,
      limit: query.limit,
      cursor: query.cursor,
    });

    const pageRows = rows.slice(0, query.limit);
    const lastRow = pageRows.at(-1);
    const hasMore = rows.length > query.limit;

    return new ShowcasePageResponse({
      items: pageRows.map((row) => this.toCard(row)),
      nextCursor: hasMore && lastRow ? lastRow.id : null,
    });
  }

  private toCard(row: ShowcaseRow): ShowcaseCardResponse {
    return new ShowcaseCardResponse({
      id: row.id,
      name: [row.user.firstName, row.user.lastName].filter(Boolean).join(' '),
      role: row.role,
      level: row.level,
      stack: row.stack,
      bio: row.bio,
      interviewsCount: row.user._count.sessionParticipations,
      inSession: row.inSession,
      myResponse: this.toMyResponse(row.latestResponse),
    });
  }

  /**
   * Отклик, который сейчас мешает откликнуться снова: ждёт решения или отклонён с паузой.
   * Отклик в ожидании с прошедшим временем встречи считается просроченным и не мешает.
   */
  private toMyResponse(latest: LatestResponse | null): ShowcaseMyResponse | null {
    if (!latest) {
      return null;
    }

    const now = Date.now();
    const retryAt = latest.status === 'REJECTED' ? retryAfterRejection(latest) : null;
    const session = latest.sessionStatus && { status: latest.sessionStatus };

    if (latest.status === 'PENDING' && latest.scheduledAt.getTime() > now) {
      return { status: 'PENDING', canRetryAt: null };
    }
    if (hasActiveMeeting({ status: latest.status, session })) {
      return { status: 'ACCEPTED', canRetryAt: null };
    }
    if (retryAt && retryAt.getTime() > now) {
      return { status: 'REJECTED', canRetryAt: retryAt };
    }

    return null;
  }
}
