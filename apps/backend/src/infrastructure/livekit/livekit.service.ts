import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

export type CreateParticipantTokenParams = {
  roomName: string;
  identity: string;
  name: string;
  metadata?: string;
  ttl?: string;
};

@Injectable()
export class LivekitService {
  private readonly logger = new Logger(LivekitService.name);
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly serverUrl: string;
  private readonly roomService: RoomServiceClient;

  constructor(configService: ConfigService) {
    this.apiKey = configService.getOrThrow<string>('LIVEKIT_API_KEY');
    this.apiSecret = configService.getOrThrow<string>('LIVEKIT_API_SECRET');
    this.serverUrl = configService.getOrThrow<string>('LIVEKIT_URL');

    const httpUrl = this.serverUrl.replace(/^ws/i, 'http');
    this.roomService = new RoomServiceClient(
      httpUrl,
      this.apiKey,
      this.apiSecret,
    );
  }

  getServerUrl(): string {
    return this.serverUrl;
  }

  async createParticipantToken(
    params: CreateParticipantTokenParams,
  ): Promise<string> {
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: params.identity,
      name: params.name,
      metadata: params.metadata,
      ttl: params.ttl ?? '2h',
    });

    token.addGrant({
      roomJoin: true,
      room: params.roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return token.toJwt();
  }

  async removeParticipant(roomName: string, identity: string): Promise<void> {
    try {
      await this.roomService.removeParticipant(roomName, identity);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.debug(
        `removeParticipant skipped (${roomName}/${identity}): ${message}`,
      );
    }
  }
}
