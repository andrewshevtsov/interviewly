import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.ts';
import { UserEntity } from '../users/entities/user-entity.ts';
import { LoginDto } from './dto/login.dto.ts';
import { RegisterDto } from './dto/register.dto.ts';
import { TelegramAuthDto } from './dto/telegram-auth.dto.ts';
import { AuthTokens, JwtPayload, RefreshPayload } from './auth.types.ts';
import { TELEGRAM_AUTH_MAX_AGE_SECONDS } from './auth.constants.ts';
import { isTelegramAuthFresh, isValidTelegramAuth } from './utils/telegram-auth.util.ts';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly accessExpiresIn: JwtSignOptions['expiresIn'];
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: JwtSignOptions['expiresIn'];
  private readonly telegramBotToken: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.accessSecret = configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.accessExpiresIn = configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    ) as JwtSignOptions['expiresIn'];
    this.refreshSecret = configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.refreshExpiresIn = configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    ) as JwtSignOptions['expiresIn'];
    this.telegramBotToken = configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
  }

  /**
   * Регистрирует нового пользователя: хеширует пароль и делегирует создание
   * `UsersService` (он же отдаёт 409 при занятом email). Возвращает пару токенов.
   */
  async register(dto: RegisterDto): Promise<AuthTokens> {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.usersService.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash,
      registrationCompleted: true,
    });

    return this.issueTokens(user);
  }

  /**
   * Проверяет email + пароль. Единое сообщение об ошибке, чтобы не раскрывать,
   * существует ли учётная запись.
   */
  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user);
  }

  /**
   * Проверяет refresh-токен (значение httpOnly-куки) и выдаёт новую пару.
   * Токены не хранятся на сервере, поэтому ротация здесь «мягкая»: старый
   * refresh остаётся валидным до истечения.
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshPayload>(
        refreshToken,
        { secret: this.refreshSecret },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService
      .findOne(payload.sub)
      .catch(() => null);
    if (!user) {
      throw new UnauthorizedException('Refresh token subject no longer exists');
    }

    return this.issueTokens(user);
  }

  /**
   * Заглушка на будущее. При stateless-JWT клиент просто удаляет токены;
   * серверу отзывать нечего. Метод оставлен как единая точка для перехода
   * на хранение refresh-токенов в БД.
   */
  logout(): { success: true } {
    return { success: true };
  }

  /**
   * Логин или регистрация через Telegram Login Widget: проверяет подпись и
   * свежесть данных, затем ищет пользователя по `telegramId` - если такого
   * ещё нет, заводит нового без email/пароля (см. `UsersService.createFromTelegram`).
   */
  async loginWithTelegram(dto: TelegramAuthDto): Promise<AuthTokens> {
    this.verifyTelegramPayload(dto);

    const telegramId = String(dto.id);
    const existingUser = await this.usersService.findByTelegramId(telegramId);
    const user =
      existingUser ??
      (await this.usersService.createFromTelegram({
        telegramId,
        telegramUsername: dto.username,
        firstName: dto.first_name,
        lastName: dto.last_name,
      }));

    return this.issueTokens(user);
  }

  /**
   * Привязывает Telegram к уже залогиненному аккаунту — второй способ входа
   * в дополнение к email/паролю.
   */
  async linkTelegram(userId: string, dto: TelegramAuthDto): Promise<void> {
    this.verifyTelegramPayload(dto);

    await this.usersService.linkTelegram(userId, {
      telegramId: String(dto.id),
      telegramUsername: dto.username,
    });
  }

  private verifyTelegramPayload(dto: TelegramAuthDto): void {
    if (!isValidTelegramAuth(dto, this.telegramBotToken)) {
      throw new UnauthorizedException('Invalid Telegram authentication data');
    }
    if (!isTelegramAuthFresh(dto.auth_date, TELEGRAM_AUTH_MAX_AGE_SECONDS)) {
      throw new UnauthorizedException('Telegram authentication data has expired');
    }
  }

  private async issueTokens(user: UserEntity): Promise<AuthTokens> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };
    const refreshPayload: RefreshPayload = { sub: user.id };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.accessSecret,
        expiresIn: this.accessExpiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresIn,
      }),
    ]);

    const { exp } = this.jwtService.decode<{ exp: number }>(refreshToken);
    return { accessToken, refreshToken, refreshTokenExpiresAt: new Date(exp * 1000) };
  }
}
