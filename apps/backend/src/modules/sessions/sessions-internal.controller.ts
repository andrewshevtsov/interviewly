import {
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionsService } from './sessions.service.ts';

@Controller('internal/sessions')
export class SessionsInternalController {
  private readonly serviceToken: string;

  constructor(
    config: ConfigService,
    private readonly sessionsService: SessionsService,
  ) {
    this.serviceToken = config.getOrThrow<string>('INTERNAL_SERVICE_TOKEN');
  }

  @Get(':id/starter-code')
  async getStarterCode(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-internal-service-token') serviceToken?: string,
  ): Promise<{ code: string | null }> {
    if (serviceToken !== this.serviceToken) {
      throw new UnauthorizedException();
    }

    return { code: await this.sessionsService.getDocumentStarterCode(id) };
  }
}
