import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.ts';
import { LoginDto } from './dto/login.dto.ts';
import { RegisterDto } from './dto/register.dto.ts';
import { RefreshTokenDto } from './dto/refresh-token.dto.ts';
import { JwtAuthGuard } from './guards/jwt-auth.guard.ts';
import { AuthTokens } from './auth.types.ts';
import { ApiBearerAuth, ApiProperty } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiProperty()
  register(@Body() dto: RegisterDto): Promise<AuthTokens> {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiProperty()
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthTokens> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiProperty()
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokens> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiProperty()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(): { success: true } {
    return this.authService.logout();
  }
}
