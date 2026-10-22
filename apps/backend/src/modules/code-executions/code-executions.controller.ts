import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.ts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { CodeExecutionsService } from './code-executions.service.ts';
import { CreateCodeExecutionDto } from './dto/create-code-execution.dto.ts';

@ApiTags('code-executions')
@Controller('sessions/:sessionId/code-executions')
export class CodeExecutionsController {
  constructor(private readonly executions: CodeExecutionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.ACCEPTED)
  create(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCodeExecutionDto,
  ) {
    return this.executions.enqueue(sessionId, userId, dto);
  }
}
