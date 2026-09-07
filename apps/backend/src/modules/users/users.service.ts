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
