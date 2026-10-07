import { BadRequestException, Injectable } from '@nestjs/common';
import { ProfileRepository } from './profile.repository.ts';
import { CreateProfileDto } from './dto/create-profile.dto.ts';

@Injectable()
export class ProfileService {
  constructor(private profileRepository: ProfileRepository) { }

  /**
   * Возвращает профиль текущего пользователя или `null`, если анкета не заполнена
   */
  async findByUserId(userId: string) {
    return this.profileRepository.findByUserId(userId);
  }

  /**
   * Создаёт или обновляет профиль текущего пользователя. `ProfileForm` на
   * фронтенде всегда отправляет анкету целиком, поэтому отдельного partial-патча нет.
   */
  async upsertByUserId(userId: string, dto: CreateProfileDto) {
    if (dto.showcaseVisible && (!dto.role.trim() || dto.stack.length === 0)) {
      throw new BadRequestException('Role and stack are required to appear in the showcase');
    }

    return this.profileRepository.upsertByUserId(userId, dto);
  }
}
