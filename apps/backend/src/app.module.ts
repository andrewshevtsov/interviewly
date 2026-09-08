import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.ts';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/user.module.ts';
import { AuthModule } from './modules/auth/auth.module.ts';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      envFilePath: '../../.env',
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
