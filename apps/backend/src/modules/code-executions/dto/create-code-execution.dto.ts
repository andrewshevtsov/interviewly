import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCodeExecutionDto {
  @IsIn(['python', 'javascript', 'typescript'])
  language!: 'python' | 'javascript' | 'typescript';

  @IsString()
  @MaxLength(50_000)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  stdin?: string;
}
