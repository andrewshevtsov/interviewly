import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service.ts';
import { CreateProfileDto } from './dto/create-profile.dto.ts';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { CurrentUser } from '../auth/decorators/current-user.decorator.ts';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private profileService: ProfileService) { }

  @Get('me')
  findMine(@CurrentUser('sub') userId: string) {
    return this.profileService.findByUserId(userId);
  }

  @Put('me')
  upsertMine(@CurrentUser('sub') userId: string, @Body() dto: CreateProfileDto) {
    return this.profileService.upsertByUserId(userId, dto);
  }
}
