import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MESSAGE_MAX_LENGTH } from '../showcase.constants.ts';

export class CreateShowcaseMessageDto {
  @ApiProperty({ description: 'Текст сообщения; длина считается после trim', minLength: 1, maxLength: MESSAGE_MAX_LENGTH })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(MESSAGE_MAX_LENGTH)
  text!: string;
}
