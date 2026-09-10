import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfileRepository } from './profile.repository.ts';
import { CreateProfileDto } from './dto/create-profile.dto.ts';
import { UpdateProfileDto } from './dto/update-profile.dto.ts';

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

  async update(id: string, updateProfileDto: UpdateProfileDto) {
    await this.findOne(id);
    return this.profileRepository.update(id, updateProfileDto);
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.profileRepository.delete(id);
  }
}
