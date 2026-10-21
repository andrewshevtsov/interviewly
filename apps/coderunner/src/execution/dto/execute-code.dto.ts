import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** Проверенное тело запроса на однократный запуск консольной программы. */
export class ExecuteCodeDto {
  /** Runtime Piston, доступный в текущем MVP. */
  @IsIn(['python', 'javascript', 'typescript'])
  language!: string;

  /** Исходный код программы; лимит меньше серверного лимита Piston. */
  @IsString()
  @MaxLength(50_000)
  code!: string;

  /** Необязательный стандартный ввод для будущих консольных тест-кейсов. */
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  stdin?: string;
}
