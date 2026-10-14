import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller.ts';
import { UsersService } from './users.service.ts';
import { UsersRepository } from './users.repository.ts';

// JwtModule нужен JwtAuthGuard контроллера; AuthModule сюда не импортируем - он сам
// импортирует UsersModule, избегаем цикла.
@Module({
  imports: [JwtModule.register({})],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
