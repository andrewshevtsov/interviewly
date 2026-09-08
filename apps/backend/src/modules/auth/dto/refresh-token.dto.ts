import { IsJWT } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description:
      'Refresh-токен, выданный при логине. Используется для получения новой пары access/refresh токенов.',
    format: 'jwt',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJpYXQiOjE3MDAwMDAwMDB9.dummy-signature',
  })
  @IsJWT()
  refreshToken!: string;
}
