import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.ts';
import { LoginDto } from './dto/login.dto.ts';
import { RegisterDto } from './dto/register.dto.ts';
import { JwtAuthGuard } from './guards/jwt-auth.guard.ts';
import { AuthTokens } from './auth.types.ts';
import { REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions } from './auth.constants.ts';
import { ApiBearerAuth, ApiProperty } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiProperty()
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const tokens = await this.authService.register(dto);
    return this.respondWithTokens(res, tokens);
  }

  @Post('login')
  @ApiProperty()
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const tokens = await this.authService.login(dto);
    return this.respondWithTokens(res, tokens);
  }

  @Post('refresh')
  @ApiProperty()
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const tokens = await this.authService.refresh(refreshToken);
    return this.respondWithTokens(res, tokens);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiProperty()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(@Res({ passthrough: true }) res: Response): { success: true } {
    res.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions());
    return this.authService.logout();
  }

  /**
   * Кладёт refresh-токен в httpOnly-куку и возвращает клиенту только access-токен —
   * refresh-токен в теле ответа больше не отдаётся.
   */
  private respondWithTokens(res: Response, tokens: AuthTokens): { accessToken: string } {
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...refreshTokenCookieOptions(),
      expires: tokens.refreshTokenExpiresAt,
    });
    return { accessToken: tokens.accessToken };
  }
}
