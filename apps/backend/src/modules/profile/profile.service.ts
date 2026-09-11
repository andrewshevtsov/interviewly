import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfileRepository } from './profile.repository.ts';
import { CreateProfileDto } from './dto/create-profile.dto.ts';
import type { UpdateProfileDto } from './dto/update-profile.dto.ts';

@Injectable()
export class ProfileService {
  constructor(private profileRepository: ProfileRepository) { }

  async create(createProfileDto: CreateProfileDto) {
    return this.profileRepository.create(createProfileDto);
  }

  async findAll() {
    return this.profileRepository.findAll();
  }

  async findOne(id: string) {
    const profile = await this.profileRepository.findOne(id);
    if (!profile) {
      throw new NotFoundException(`Profile with id ${id} not found`);
    }
    return profile;
  }

  async findByEmail(email: string) {
    const profile = await this.profileRepository.findByEmail(email);
    if (!profile) {
      throw new NotFoundException(`Profile with email ${email} not found`);
    }
    return profile;
  }

  /**
   * Возвращает профиль текущего пользователя или `null`, если он ещё не
   * заполнял анкету — в отличие от `findOne`/`findByEmail` это ожидаемая ветка.
   */
  async findByUserId(userId: string) {
    return this.profileRepository.findByUserId(userId);
  }

  /**
   * Создаёт или обновляет профиль текущего пользователя. `ProfileForm` на
   * фронтенде всегда отправляет анкету целиком, поэтому здесь нет отдельного
   * partial-патча — только create-or-replace по `userId`.
   */
  async upsertByUserId(userId: string, dto: CreateProfileDto) {
    const existing = await this.profileRepository.findByUserId(userId);
    if (existing) {
      return this.profileRepository.update(existing.id, dto);
    }
    return this.profileRepository.create({ ...dto, userId });
  }

  async update(id: string, updateProfileDto: UpdateProfileDto) {
    await this.findOne(id);
    return this.profileRepository.update(id, updateProfileDto);
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.profileRepository.delete(id);
  }
}
