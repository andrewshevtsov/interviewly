import type { Prisma } from '../../prisma/generated/client.ts';

interface CodeExecutionJobBase {
  executionId: string;
  sessionId: string;
  requestedById: string;
  userName: string;
  language: 'python' | 'javascript' | 'typescript';
  code: string;
  executionStartedAt: number;
  queuedAt: number;
}

export interface CustomCodeExecutionJob extends CodeExecutionJobBase {
  kind: 'custom';
  stdin?: string;
  outcome?: CodeExecutionOutcome;
}

export interface TestCaseDefinition {
  position: number;
  name: string;
  input: Prisma.JsonValue;
  expectedOutput: Prisma.JsonValue;
}

export interface TestCaseResult extends TestCaseDefinition {
  status: 'passed' | 'failed' | 'error';
  actualOutput: unknown;
  execution: ExecutionResult | null;
}

export interface TaskCodeExecutionJob extends CodeExecutionJobBase {
  kind: 'task-case';
  caseIndex: number;
  testCases: TestCaseDefinition[];
  caseResults: TestCaseResult[];
  caseResult?: TestCaseResult;
}

export type CodeExecutionJob = CustomCodeExecutionJob | TaskCodeExecutionJob;

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: string | null;
  status: string | null;
  message: string | null;
  memory: number | null;
  cpuTime: number | null;
  wallTime: number | null;
}

export type CodeExecutionOutcome =
  | {
      status: 'success';
      result: ExecutionResult;
    }
  | {
      status: 'error';
    };

export interface TaskExecutionResult {
  completedCases: number;
  totalCases: number;
  cases: TestCaseResult[];
}

export type ExecutionLogPatch = {
  id: string;
  userName?: string;
  startedAt?: number;
  status:
    | 'queued'
    | 'running'
    | 'completed'
    | 'success'
    | 'error'
    | 'queue_timeout'
    | 'rejected';
  result?: ExecutionResult | TaskExecutionResult;
};
