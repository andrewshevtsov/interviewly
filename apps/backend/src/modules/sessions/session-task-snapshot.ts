import type { Prisma } from '../../prisma/generated/client.ts';
import {
  EditorLanguage,
  ProgrammingTaskDifficulty,
} from '../../prisma/generated/enums.ts';

/** Источник неизменяемого условия задачи, сохранённого вместе с сессией. */
export enum SessionTaskSnapshotSource {
  BANK = 'BANK',
  CUSTOM = 'CUSTOM',
}

export interface SessionTaskSnapshotCase {
  position: number;
  name: string;
  input: Prisma.JsonValue;
  expectedOutput: Prisma.JsonValue;
}

export interface CustomSessionTaskSnapshot {
  source: SessionTaskSnapshotSource.CUSTOM;
  language: EditorLanguage;
  starterCode: string;
}

export interface BankSessionTaskSnapshot {
  source: SessionTaskSnapshotSource.BANK;
  language: EditorLanguage;
  starterCode: string;
  description?: string;
  harnessCode: string;
  testCases: SessionTaskSnapshotCase[];
}

export type SessionTaskSnapshot =
  | CustomSessionTaskSnapshot
  | BankSessionTaskSnapshot;

interface CreateBankSessionTaskSnapshotInput {
  taskId: string;
  slug: string;
  title: string;
  description: string;
  difficulty: ProgrammingTaskDifficulty;
  language: EditorLanguage;
  starterCode: string;
  harnessCode: string;
  testCases: SessionTaskSnapshotCase[];
}

/** Создаёт JSON-снапшот пользовательского условия. */
export function createCustomSessionTaskSnapshot(
  language: EditorLanguage,
  starterCode: string,
): Prisma.InputJsonObject {
  return {
    source: SessionTaskSnapshotSource.CUSTOM,
    language,
    starterCode,
  };
}

/** Создаёт полную неизменяемую копию банковской задачи. */
export function createBankSessionTaskSnapshot(
  input: CreateBankSessionTaskSnapshotInput,
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify({
      source: SessionTaskSnapshotSource.BANK,
      ...input,
    }),
  ) as Prisma.InputJsonValue;
}

/**
 * Проверяет JSON из БД и нормализует старый банковский формат без `source`.
 * Невалидный или отсутствующий снапшот возвращается как `null`.
 */
export function parseSessionTaskSnapshot(
  value: Prisma.JsonValue,
): SessionTaskSnapshot | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const language = value.language;
  const starterCode = value.starterCode;
  if (
    typeof language !== 'string' ||
    !Object.values(EditorLanguage).includes(language as EditorLanguage) ||
    typeof starterCode !== 'string'
  ) {
    return null;
  }

  if (value.source === SessionTaskSnapshotSource.CUSTOM) {
    return {
      source: SessionTaskSnapshotSource.CUSTOM,
      language: language as EditorLanguage,
      starterCode,
    };
  }

  if (
    value.source !== undefined &&
    value.source !== SessionTaskSnapshotSource.BANK
  ) {
    return null;
  }
  if (typeof value.harnessCode !== 'string' || !Array.isArray(value.testCases)) {
    return null;
  }

  const testCases: SessionTaskSnapshotCase[] = [];
  for (const testCase of value.testCases) {
    if (
      typeof testCase !== 'object' ||
      testCase === null ||
      Array.isArray(testCase) ||
      typeof testCase.position !== 'number' ||
      typeof testCase.name !== 'string' ||
      !('input' in testCase) ||
      !('expectedOutput' in testCase)
    ) {
      return null;
    }
    testCases.push({
      position: testCase.position,
      name: testCase.name,
      input: testCase.input as Prisma.JsonValue,
      expectedOutput: testCase.expectedOutput as Prisma.JsonValue,
    });
  }
  if (testCases.length === 0) {
    return null;
  }

  return {
    source: SessionTaskSnapshotSource.BANK,
    language: language as EditorLanguage,
    starterCode,
    description:
      typeof value.description === 'string' ? value.description : undefined,
    harnessCode: value.harnessCode,
    testCases,
  };
}
