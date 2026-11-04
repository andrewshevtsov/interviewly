import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EditorLanguage } from '../../../prisma/generated/enums.ts';

export class ListProgrammingTasksQueryDto {
  @ApiProperty({ enum: EditorLanguage, enumName: 'EditorLanguage' })
  @IsEnum(EditorLanguage)
  language!: EditorLanguage;
}
