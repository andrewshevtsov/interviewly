import { Injectable } from '@nestjs/common';

/** Обслуживает корневую проверку доступности, не связанную с выполнением кода. */
@Injectable()
export class AppService {
  /** @returns Тестовая строка доступности сервиса. */
  getHello(): string {
    return 'Hello World!';
  }
}
