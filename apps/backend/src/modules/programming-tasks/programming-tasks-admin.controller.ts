import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EditorLanguage } from '../../prisma/generated/enums.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import { CurrentUser } from '../auth/decorators/current-user.decorator.ts';
import { AdminGuard } from '../auth/guards/admin.guard.ts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { CreateProgrammingTaskDto } from './dto/create-programming-task.dto.ts';
import { ReverifyProgrammingTaskVariantDto } from './dto/reverify-programming-task-variant.dto.ts';
import { UpdateProgrammingTaskDetailsDto } from './dto/update-programming-task-details.dto.ts';
import { UpsertProgrammingTaskVariantDto } from './dto/upsert-programming-task-variant.dto.ts';
import { ProgrammingTasksService } from './programming-tasks.service.ts';

@ApiTags('programming-tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('programming-tasks')
export class ProgrammingTasksAdminController {
  constructor(private readonly service: ProgrammingTasksService) {}

  @Post()
  @ApiOperation({
    summary: 'Создать задачу и поставить первую реализацию в очередь проверки',
  })
  create(
    @CurrentUser() actor: JwtPayload,
    @Body() dto: CreateProgrammingTaskDto,
  ) {
    return this.service.createAndVerify(actor.sub, dto);
  }

  @Post(':taskId/variants')
  @ApiOperation({
    summary: 'Добавить языковой вариант и поставить его в очередь проверки',
  })
  addVariant(
    @CurrentUser() actor: JwtPayload,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Body() dto: UpsertProgrammingTaskVariantDto,
  ) {
    return this.service.addVariantAndVerify(taskId, actor.sub, dto);
  }

  @Put(':taskId/variants/:variantId')
  @ApiOperation({
    summary: 'Обновить реализацию и поставить повторную проверку в очередь',
  })
  updateAndVerify(
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Param('variantId', new ParseUUIDPipe()) variantId: string,
    @Body() dto: ReverifyProgrammingTaskVariantDto,
  ) {
    return this.service.updateAndVerify(taskId, variantId, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Обновить общие поля задачи без верификации варианта',
  })
  updateDetails(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProgrammingTaskDetailsDto,
  ) {
    return this.service.updateDetails(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить задачу со всеми языковыми вариантами' })
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.service.delete(id);
  }

  @Get('harness-templates/:language')
  @ApiOperation({
    summary: 'Стандартный Harness для создания языкового варианта',
  })
  getHarnessTemplate(
    @Param('language', new ParseEnumPipe(EditorLanguage))
    language: EditorLanguage,
  ): Promise<{ harnessCode: string }> {
    return this.service.getHarnessTemplate(language);
  }

  @Get(':id/edit')
  @ApiOperation({ summary: 'Полные данные задачи для редактирования' })
  findForEditing(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findForEditing(id);
  }
}
