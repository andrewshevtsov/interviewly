import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller.ts';
import { UsersService } from './users.service.ts';
import { UsersRepository } from './users.repository.ts';
import { EmailModule } from '../../infrastructure/email/email.module.ts';
import { PrismaModule } from '../../prisma/prisma.module.ts';
import { EmailChangeController } from './email-change.controller.ts';
import { EmailChangeRepository } from './email-change.repository.ts';
import { EmailChangeService } from './email-change.service.ts';

// JwtModule нужен JwtAuthGuard контроллера; AuthModule сюда не импортируем - он сам
// импортирует UsersModule, избегаем цикла.
@Module({
  imports: [JwtModule.register({}), EmailModule, PrismaModule],
  controllers: [UsersController, EmailChangeController],
  providers: [UsersService, UsersRepository, EmailChangeService, EmailChangeRepository],
  exports: [UsersService],
})
export class UsersModule {}
