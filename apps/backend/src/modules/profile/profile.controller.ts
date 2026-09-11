import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service.ts';
import { CreateProfileDto } from './dto/create-profile.dto.ts';
import { UpdateProfileDto } from './dto/update-profile.dto.ts';
import { ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';

@Controller('profiles')
export class ProfileController {
  constructor(private profileService: ProfileService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiProperty()
  @ApiBearerAuth()
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profileService.create(createProfileDto);
  }

  @Get()
  @ApiProperty()
  findAll() {
    return this.profileService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiProperty()
  findOne(@Param('id') id: string) {
    return this.profileService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiProperty()
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.update(id, updateProfileDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiProperty()
  @ApiBearerAuth()
  delete(@Param('id') id: string) {
    return this.profileService.delete(id);
  }
}
