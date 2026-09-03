import { Module } from '@nestjs/common';
import { AppController } from './app.controller.ts';
import { AppService } from './app.service.ts';
import { PrismaModule } from './prisma/prisma.module.ts';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module.ts';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      envFilePath: './../.env',
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
