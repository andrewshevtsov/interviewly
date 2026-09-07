import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto.ts';

/**
 * Тело запроса на частичное обновление пользователя: все поля `CreateUserDto`
 * становятся необязательными, правила валидации сохраняются.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
