import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShowcaseQueryDto } from './dto/showcase-query.dto.ts';
import { ShowcasePageResponse } from './entities/showcase-card.entity.ts';
import { ShowcaseService } from './showcase.service.ts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { CurrentUser } from '../auth/decorators/current-user.decorator.ts';

@ApiTags('showcase')
@Controller('showcase')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShowcaseController {
  constructor(private readonly showcaseService: ShowcaseService) {}

  @Get('cards')
  @ApiOperation({
    summary: 'Карточки участников на витрине с фильтрами по уровню, стеку и поиском; свою карточку не отдаёт',
  })
  findPage(
    @CurrentUser('sub') userId: string,
    @Query() query: ShowcaseQueryDto,
  ): Promise<ShowcasePageResponse> {
    return this.showcaseService.findPage(userId, query);
  }
}
