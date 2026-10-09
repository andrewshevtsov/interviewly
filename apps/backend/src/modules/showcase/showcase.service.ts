import { Injectable } from '@nestjs/common';
import { ShowcaseCardResponse, ShowcasePageResponse } from './entities/showcase-card.entity.ts';
import { ShowcaseRepository, type ShowcaseRow } from './showcase.repository.ts';
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
    });
  }
}
