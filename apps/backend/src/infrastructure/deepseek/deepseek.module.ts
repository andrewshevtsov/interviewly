import { Module } from '@nestjs/common';
import { DeepseekService } from './deepseek.service.ts';

@Module({
  providers: [DeepseekService],
  exports: [DeepseekService],
})
export class DeepseekModule {}
