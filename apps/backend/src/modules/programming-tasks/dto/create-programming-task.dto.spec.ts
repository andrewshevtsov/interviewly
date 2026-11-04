import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
  CreateProgrammingTaskCaseDto,
  CreateProgrammingTaskDto,
} from './create-programming-task.dto.ts';

const validPayload = {
  title: 'Sum',
  description: 'Return sum.',
  difficulty: 'EASY',
  language: 'JAVASCRIPT',
  starterCode: 'function solve(numbers) {}',
  harnessCode: 'console.log(JSON.stringify(solve(input)));',
  referenceSolution: 'function solve(numbers) { return 6; }',
  testCases: [{ name: 'Case 1', input: [1, 2, 3], expectedOutput: 6 }],
};

describe('CreateProgrammingTaskDto', () => {
  it('отклоняет title из одних пробелов', async () => {
    const instance = plainToInstance(CreateProgrammingTaskDto, {
      ...validPayload,
      title: '   ',
    });

    const errors = await validate(instance);

    expect(errors.some((error) => error.property === 'title')).toBe(true);
  });

  it('обрезает пробелы по краям title и description до валидации', async () => {
    const instance = plainToInstance(CreateProgrammingTaskDto, {
      ...validPayload,
      title: '  Sum  ',
      description: '  Return sum.  ',
    });

    const errors = await validate(instance);

    expect(errors).toHaveLength(0);
    expect(instance.title).toBe('Sum');
    expect(instance.description).toBe('Return sum.');
  });

  it('отклоняет задачу без тест-кейсов, если title - пробелы даже с валидными тестами', async () => {
    const instance = plainToInstance(CreateProgrammingTaskDto, {
      ...validPayload,
      title: '\t\n ',
    });

    const errors = await validate(instance);

    expect(errors.find((error) => error.property === 'title')?.constraints).toHaveProperty(
      'minLength',
    );
  });
});

describe('CreateProgrammingTaskCaseDto', () => {
  it('разрешает null во входных и ожидаемых данных', async () => {
    const instance = plainToInstance(CreateProgrammingTaskCaseDto, {
      name: 'Case 1',
      input: null,
      expectedOutput: null,
    });

    const errors = await validate(instance);

    expect(errors).toHaveLength(0);
  });

  it('отклоняет полностью отсутствующее поле input', async () => {
    const instance = plainToInstance(CreateProgrammingTaskCaseDto, {
      name: 'Case 1',
      expectedOutput: 6,
    });

    const errors = await validate(instance);

    expect(errors.some((error) => error.property === 'input')).toBe(true);
  });

  it('обрезает пробелы по краям имени тест-кейса', async () => {
    const instance = plainToInstance(CreateProgrammingTaskCaseDto, {
      name: '  Case 1  ',
      input: 1,
      expectedOutput: 1,
    });

    const errors = await validate(instance);

    expect(errors).toHaveLength(0);
    expect(instance.name).toBe('Case 1');
  });

  it('отклоняет имя тест-кейса из одних пробелов', async () => {
    const instance = plainToInstance(CreateProgrammingTaskCaseDto, {
      name: '   ',
      input: 1,
      expectedOutput: 1,
    });

    const errors = await validate(instance);

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });
});
