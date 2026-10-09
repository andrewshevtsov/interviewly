import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/** Простой корневой endpoint для ручной проверки доступности HTTP-приложения. */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** @returns Тестовая строка доступности сервиса. */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
