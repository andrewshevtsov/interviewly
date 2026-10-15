import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Проверенное тело запроса на однократный запуск консольной программы. */
export class ExecuteCodeDto {
  /** Сессия, участие в которой coderunner подтверждает через основной backend. */
  @IsUUID()
  sessionId!: string;

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
