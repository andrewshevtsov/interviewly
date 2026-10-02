import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetEditorOpenDto {
  @ApiProperty({ description: 'true - открыть редактор (лайв-кодинг), false - закрыть (знакомство)' })
  @IsBoolean()
  open!: boolean;
}
