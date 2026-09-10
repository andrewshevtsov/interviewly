import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service.ts';
import { ProfileController } from './profile.controller.ts';
import { ProfileRepository } from './profile.repository.ts';
import { PrismaModule } from '../../prisma/prisma.module.ts';
import { AuthModule } from '../auth/auth.module.ts';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileRepository, JwtService],
  exports: [ProfileService],
})
export class ProfileModule { }
