import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository.ts';
import { CreateUserDto } from './dto/create-user.dto.ts';
import { UpdateUserDto } from './dto/update-user.dto.ts';
import { UserEntity } from './entities/user-entity.ts';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        `User with email "${dto.email}" already exists`,
      );
    }

    const user = await this.usersRepository.create(dto);
    return new UserEntity(user);
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.usersRepository.findMany();
    return users.map((user) => new UserEntity(user));
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User "${id}" not found`);
    }
    return new UserEntity(user);
  }

  /**
   * Возвращает пользователя по email или `null`. В отличие от `findOne`, не
   * бросает исключение — предназначен для сценариев аутентификации, где
   * отсутствие пользователя это ожидаемая ветка. Сущность сохраняет
   * `passwordHash` в памяти (вырезается лишь при сериализации ответа).
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.usersRepository.findByEmail(email);
    return user ? new UserEntity(user) : null;
  }

  /**
   * Возвращает пользователя, привязанного к данному аккаунту Telegram, или
   * `null`. Используется сценариями аутентификации (см. `findByEmail`).
   */
  async findByTelegramId(telegramId: string): Promise<UserEntity | null> {
    const user = await this.usersRepository.findByTelegramId(telegramId);
    return user ? new UserEntity(user) : null;
  }

  /**
   * Заводит пользователя из данных Telegram Login Widget. Проверка подписи -
   * забота вызывающего кода (`AuthService`), сюда попадают уже доверенные
   * данные. У Telegram нет email, поэтому используется детерминированный
   * плейсхолдер `tg-<telegramId>@telegram.interviewly.local` - не идёт
   * пользователю на почту и не считается подтверждённым (`registrationCompleted:
   * false`), настоящий email пользователь укажет позже в профиле.
   */
  async createFromTelegram(profile: {
    telegramId: string;
    telegramUsername?: string;
    firstName: string;
    lastName?: string;
  }): Promise<UserEntity> {
    const user = await this.usersRepository.create({
      email: `tg-${profile.telegramId}@telegram.interviewly.local`,
      firstName: profile.firstName,
      lastName: profile.lastName,
      telegramId: profile.telegramId,
      telegramUsername: profile.telegramUsername,
      telegramLinkedAt: new Date(),
      registrationCompleted: false,
    });
    return new UserEntity(user);
  }

  /**
   * Привязывает Telegram-аккаунт к существующему пользователю. 409, если этот telegramId уже
   * привязан к другому аккаунту.
   */
  async linkTelegram(
    userId: string,
    profile: { telegramId: string; telegramUsername?: string },
  ): Promise<UserEntity> {
    const owner = await this.usersRepository.findByTelegramId(profile.telegramId);
    if (owner && owner.id !== userId) {
      throw new ConflictException(
        'This Telegram account is already linked to another user',
      );
    }

    const user = await this.usersRepository.update(userId, {
      telegramId: profile.telegramId,
      telegramUsername: profile.telegramUsername,
      telegramLinkedAt: new Date(),
    });
    return new UserEntity(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    await this.findOne(id);

    if (dto.email) {
      const owner = await this.usersRepository.findByEmail(dto.email);
      if (owner && owner.id !== id) {
        throw new ConflictException(
          `User with email "${dto.email}" already exists`,
        );
      }
    }

    const user = await this.usersRepository.update(id, dto);
    return new UserEntity(user);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.usersRepository.delete(id);
  }
}
