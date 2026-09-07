import { Exclude } from 'class-transformer';
import type { User } from '../../../prisma/generated/client.ts';
import { UserStatus } from '../../../prisma/generated/enums.ts';

/**
 * API-представление пользователя. Оборачивает строку модели Prisma и
 * гарантирует, что `passwordHash` никогда не попадёт в ответ: поле помечено
 * `@Exclude`, поэтому `ClassSerializerInterceptor` вырежет его при сериализации.
 */
export class UserEntity implements User {
  id!: string;
  email!: string;
  emailVerifiedAt!: Date | null;
  firstName!: string;
  lastName!: string | null;
  avatarPath!: string | null;
  timeZone!: string | null;
  isAdmin!: boolean;
  registrationCompleted!: boolean;
  status!: UserStatus;
  statusUpdatedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;

  @Exclude()
  passwordHash!: string | null;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
