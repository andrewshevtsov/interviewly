import { registerDecorator, type ValidationOptions } from 'class-validator';
import { findLinks } from './links.ts';

/**
 * Запрещает ссылки в текстовом поле: его видят другие пользователи, и ссылка в нём - готовый фишинг.
 * Не-строки пропускает: тип проверяют соседние декораторы.
 */
export function NoLinks(validationOptions?: ValidationOptions) {
  return function (target: object, propertyKey: string): void {
    registerDecorator({
      name: 'noLinks',
      target: target.constructor,
      propertyName: propertyKey,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value !== 'string' || findLinks(value).length === 0;
        },
        defaultMessage(): string {
          return `${propertyKey} must not contain links`;
        },
      },
    });
  };
}
