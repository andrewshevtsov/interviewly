import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/user.module.ts';
import { AuthController } from './auth.controller.ts';
import { TelegramAuthController } from './telegram-auth.controller.ts';
import { TelegramOidcService } from './telegram-oidc.service.ts';
import { AuthDevController } from './auth-dev.controller.ts';
import { AuthService } from './auth.service.ts';
import { JwtAuthGuard } from './guards/jwt-auth.guard.ts';
import { DevOnlyGuard } from './guards/dev-only.guard.ts';
import { AdminGuard } from './guards/admin.guard.ts';

@Module({
  // Секреты и TTL передаются per-call в AuthService/JwtAuthGuard, поэтому
  // здесь регистрируем JwtModule без глобальной конфигурации.
  imports: [UsersModule, JwtModule.register({})],
  controllers: [AuthController, TelegramAuthController, AuthDevController],
  providers: [AuthService, TelegramOidcService, JwtAuthGuard, DevOnlyGuard, AdminGuard],
  exports: [AuthService, JwtAuthGuard, AdminGuard, JwtModule],
})
export class AuthModule {}
