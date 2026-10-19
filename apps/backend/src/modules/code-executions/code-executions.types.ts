export interface CodeExecutionJob {
  executionId: string;
  sessionId: string;
  requestedById: string;
  userName: string;
  language: 'python' | 'javascript' | 'typescript';
  code: string;
  stdin?: string;
  queuedAt: number;
  outcome?: CodeExecutionOutcome;
}

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

export type ExecutionLogPatch = {
  id: string;
  userName?: string;
  startedAt?: number;
  status:
    'queued' | 'running' | 'success' | 'error' | 'queue_timeout' | 'rejected';
  result?: ExecutionResult;
};
