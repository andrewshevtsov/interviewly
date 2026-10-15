import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ExecuteCodeDto } from './dto/execute-code.dto';
import { ExecutionService } from './execution.service';

/** HTTP-вход coderunner: принимает код, но делегирует проверки и запуск сервису. */
@Controller('execution')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  /**
   * Запускает код участника сессии; access JWT только пересылается backend для проверки.
   * @param body Проверенное тело запроса.
   * @param authorization Исходный заголовок Authorization браузера.
   * @returns Нормализованный результат выполнения.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  execute(
    @Body() body: ExecuteCodeDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.executionService.execute(body, authorization);
  }
}
