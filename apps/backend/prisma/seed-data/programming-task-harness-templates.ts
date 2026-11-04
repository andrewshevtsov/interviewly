import { EditorLanguage } from '../../src/prisma/generated/enums';

/** Стандартная обвязка JavaScript: JSON из stdin → solve(input) → JSON в stdout. */
export const JAVASCRIPT_SOLVE_HARNESS = `(() => {
  const __interviewlyFs = require('fs');
  const __interviewlyInput = JSON.parse(__interviewlyFs.readFileSync(0, 'utf8'));
  const __interviewlyResult = solve(__interviewlyInput);
  process.stdout.write(JSON.stringify(__interviewlyResult));
})();`;

/** Стандартная обвязка TypeScript с декларациями API среды исполнения. */
export const TYPESCRIPT_SOLVE_HARNESS = `declare const require: (name: string) => {
  readFileSync(fd: number, encoding: string): string;
};
declare const process: { stdout: { write(value: string): void } };

(() => {
  const __interviewlyFs = require('fs');
  const __interviewlyInput = JSON.parse(__interviewlyFs.readFileSync(0, 'utf8')) as unknown;
  const __interviewlyResult = solve(__interviewlyInput as never);
  process.stdout.write(JSON.stringify(__interviewlyResult));
})();`;

/** Стандартная обвязка Python: JSON из stdin → solve(input) → JSON в stdout. */
export const PYTHON_SOLVE_HARNESS = `def __interviewly_run():
    import json as __interviewly_json
    import sys as __interviewly_sys

    __interviewly_input = __interviewly_json.load(__interviewly_sys.stdin)
    __interviewly_result = solve(__interviewly_input)
    __interviewly_sys.stdout.write(
        __interviewly_json.dumps(__interviewly_result, ensure_ascii=False)
    )


__interviewly_run()`;

export default [
  {
    language: EditorLanguage.JAVASCRIPT,
    code: JAVASCRIPT_SOLVE_HARNESS,
    version: 1,
    isActive: true,
  },
  {
    language: EditorLanguage.TYPESCRIPT,
    code: TYPESCRIPT_SOLVE_HARNESS,
    version: 1,
    isActive: true,
  },
  {
    language: EditorLanguage.PYTHON,
    code: PYTHON_SOLVE_HARNESS,
    version: 1,
    isActive: true,
  },
];
