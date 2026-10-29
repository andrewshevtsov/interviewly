CREATE TABLE "ProgrammingTaskHarnessTemplate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "language" "EditorLanguage" NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProgrammingTaskHarnessTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProgrammingTaskHarnessTemplate_language_key"
    ON "ProgrammingTaskHarnessTemplate"("language");

CREATE INDEX "ProgrammingTaskHarnessTemplate_isActive_idx"
    ON "ProgrammingTaskHarnessTemplate"("isActive");

INSERT INTO "ProgrammingTaskHarnessTemplate" (
    "language",
    "code",
    "version",
    "isActive",
    "updatedAt"
)
VALUES
(
    'JAVASCRIPT',
    '(() => {
  const __interviewlyFs = require(''fs'');
  const __interviewlyInput = JSON.parse(__interviewlyFs.readFileSync(0, ''utf8''));
  const __interviewlyResult = solve(__interviewlyInput);
  process.stdout.write(JSON.stringify(__interviewlyResult));
})();',
    1,
    true,
    CURRENT_TIMESTAMP
),
(
    'TYPESCRIPT',
    'declare const require: (name: string) => {
  readFileSync(fd: number, encoding: string): string;
};
declare const process: { stdout: { write(value: string): void } };

(() => {
  const __interviewlyFs = require(''fs'');
  const __interviewlyInput = JSON.parse(__interviewlyFs.readFileSync(0, ''utf8'')) as unknown;
  const __interviewlyResult = solve(__interviewlyInput as never);
  process.stdout.write(JSON.stringify(__interviewlyResult));
})();',
    1,
    true,
    CURRENT_TIMESTAMP
),
(
    'PYTHON',
    'def __interviewly_run():
    import json as __interviewly_json
    import sys as __interviewly_sys

    __interviewly_input = __interviewly_json.load(__interviewly_sys.stdin)
    __interviewly_result = solve(__interviewly_input)
    __interviewly_sys.stdout.write(
        __interviewly_json.dumps(__interviewly_result, ensure_ascii=False)
    )


__interviewly_run()',
    1,
    true,
    CURRENT_TIMESTAMP
);
