import {
  Controller,
  Get,
  Post,
  Put,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator.ts';

@Controller('profiles')
export class ProfileController {
  constructor(private profileService: ProfileService) { }

  // "me"-маршруты объявлены раньше `:id`, иначе Nest матчит `/profiles/me`
  // как findOne(id="me").

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiProperty()
  findMine(@CurrentUser('sub') userId: string) {
    return this.profileService.findByUserId(userId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiProperty()
  upsertMine(@CurrentUser('sub') userId: string, @Body() dto: CreateProfileDto) {
    return this.profileService.upsertByUserId(userId, dto);
  }

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
