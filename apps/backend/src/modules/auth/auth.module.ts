import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/user.module.ts';
import { AuthController } from './auth.controller.ts';
import { AuthService } from './auth.service.ts';
import { JwtAuthGuard } from './guards/jwt-auth.guard.ts';

@Module({
  // Секреты и TTL передаются per-call в AuthService/JwtAuthGuard, поэтому
  // здесь регистрируем JwtModule без глобальной конфигурации.
  imports: [UsersModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
