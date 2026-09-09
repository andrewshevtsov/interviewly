import { Module } from '@nestjs/common';
import { AppController } from './app.controller.ts';
import { AppService } from './app.service.ts';
import { PrismaModule } from './prisma/prisma.module.ts';
import { ConfigModule } from "@nestjs/config"

@Module({
  imports: [PrismaModule,
    ConfigModule.forRoot({
      envFilePath: '../../.env',
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
