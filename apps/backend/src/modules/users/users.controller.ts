import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.ts';
import { UpdateMeDto } from './dto/update-me.dto.ts';
import { UserEntity } from './entities/user-entity.ts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.ts';
import { CurrentUser } from '../auth/decorators/current-user.decorator.ts';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  findMe(@CurrentUser('sub') userId: string): Promise<UserEntity> {
    return this.usersService.findOne(userId);
  }

  @Patch('me')
  updateMe(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateMeDto,
  ): Promise<UserEntity> {
    return this.usersService.updateMe(userId, dto);
  }
}
