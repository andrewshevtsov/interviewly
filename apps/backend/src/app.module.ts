import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.ts';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/user.module.ts';
import { AuthModule } from './modules/auth/auth.module.ts';
import { ProfileModule } from './modules/profile/profile.module.ts';
import { SessionsModule } from './modules/sessions/sessions.module.ts';
import { FeedbackModule } from './modules/feedback/feedback.module.ts';
import { SessionHintsModule } from './modules/session-hints/session-hints.module.ts';
import { ShowcaseModule } from './modules/showcase/showcase.module.ts';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module.ts';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      envFilePath: '../../.env',
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    ProfileModule,
    FeedbackModule,
    SessionsModule,
    SessionHintsModule,
    LeaderboardModule,
    ShowcaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
