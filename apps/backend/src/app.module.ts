import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.ts';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/user.module.ts';
import { AuthModule } from './modules/auth/auth.module.ts';
import { ProfileModule } from './modules/profile/profile.module.ts';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
