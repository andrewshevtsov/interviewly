import { afterEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/shared/api/http-client";
import {
  programmingTaskApi,
  type CreateProgrammingTaskInput,
  type CreateProgrammingTaskResponse,
  type ProgrammingTaskEditItem,
} from "./index";

const createInput: CreateProgrammingTaskInput = {
  title: "Sum",
  description: "Return sum.",
  difficulty: "EASY",
  language: "JAVASCRIPT",
  starterCode: "function solve(numbers) {}",
  harnessCode: "console.log(JSON.stringify(solve(input)));",
  referenceSolution: "function solve(numbers) { return 6; }",
  testCases: [{ name: "Case 1", input: [1, 2, 3], expectedOutput: 6 }],
};
const variantInput = {
  language: createInput.language,
  starterCode: createInput.starterCode,
  harnessCode: createInput.harnessCode,
  referenceSolution: createInput.referenceSolution,
  testCases: createInput.testCases,
};
// Язык варианта неизменяем - reverify его вообще не принимает.
const reverifyInput = {
  starterCode: createInput.starterCode,
  harnessCode: createInput.harnessCode,
  referenceSolution: createInput.referenceSolution,
  testCases: createInput.testCases,
};
const TASK_VERSION = 1;
const verificationResponse: CreateProgrammingTaskResponse = {
  id: "task-id",
  slug: "sum",
  variantId: "variant-id",
  status: "VERIFIED",
  verificationError: null,
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("programmingTaskApi admin flow", () => {
  it("ожидает финальный статус поставленного в очередь варианта", async () => {
    const task: ProgrammingTaskEditItem = {
      id: "task-id",
      slug: "sum",
      title: "Sum",
      description: "Return sum.",
      difficulty: "EASY",
      version: TASK_VERSION,
      variants: [
        {
          id: "variant-id",
          language: "JAVASCRIPT",
          starterCode: createInput.starterCode,
          harnessCode: createInput.harnessCode,
          referenceSolution: createInput.referenceSolution,
          status: "VERIFIED",
          verifiedAt: new Date().toISOString(),
          lastVerificationError: null,
          testCases: [],
        },
      ],
    };
    vi.spyOn(httpClient, "get").mockResolvedValue({ data: task } as never);

    await expect(
      programmingTaskApi.waitForVerification("task-id", "variant-id"),
    ).resolves.toMatchObject({
      id: "task-id",
      variantId: "variant-id",
      status: "VERIFIED",
    });
  });

  it("по истечении ожидания бросает последнюю известную причину задержки", async () => {
    const pendingTask: ProgrammingTaskEditItem = {
      id: "task-id",
      slug: "sum",
      title: "Sum",
      description: "Return sum.",
      difficulty: "EASY",
      version: TASK_VERSION,
      variants: [
        {
          id: "variant-id",
          language: "JAVASCRIPT",
          starterCode: createInput.starterCode,
          harnessCode: createInput.harnessCode,
          referenceSolution: createInput.referenceSolution,
          status: "VERIFYING",
          verifiedAt: null,
          lastVerificationError:
            "Session code execution queue is busy; verification will retry automatically.",
          testCases: [],
        },
      ],
    };
    vi.spyOn(httpClient, "get").mockResolvedValue({ data: pendingTask } as never);
    vi.useFakeTimers();

    // Таймаут (700мс) короче интервала опроса (750мс) - цикл должен успеть
    // ровно одну итерацию (запрос + лог причины), затем выйти по дедлайну.
    const waiting = programmingTaskApi.waitForVerification("task-id", "variant-id", 700);
    const rejection = expect(waiting).rejects.toThrow(
      "Session code execution queue is busy",
    );
    await vi.advanceTimersByTimeAsync(2_000);
    await rejection;
  });

  it("создаёт задачу через общий endpoint", async () => {
    const post = vi
      .spyOn(httpClient, "post")
      .mockResolvedValue({ data: verificationResponse } as never);

    await expect(programmingTaskApi.create(createInput)).resolves.toEqual(verificationResponse);
    expect(post).toHaveBeenCalledWith("/programming-tasks", createInput);
  });

  it("повторно проверяет конкретный вариант, не создавая новый и не меняя язык", async () => {
    const put = vi
      .spyOn(httpClient, "put")
      .mockResolvedValue({ data: verificationResponse } as never);

    await programmingTaskApi.reverify("task-id", "variant-id", reverifyInput);

    expect(put).toHaveBeenCalledWith(
      "/programming-tasks/task-id/variants/variant-id",
      reverifyInput,
    );
    const body = put.mock.calls[0]?.[1];
    expect(body).not.toHaveProperty("language");
  });

  it("добавляет следующий язык к существующей задаче", async () => {
    const post = vi
      .spyOn(httpClient, "post")
      .mockResolvedValue({ data: verificationResponse } as never);

    const pythonVariant = {
      ...variantInput,
      language: "PYTHON",
    } as const;
    await programmingTaskApi.addVariant("task-id", pythonVariant);

    expect(post).toHaveBeenCalledWith("/programming-tasks/task-id/variants", pythonVariant);
  });

  it("сохраняет первый шаг без запуска endpoint верификации", async () => {
    const details = {
      expectedVersion: TASK_VERSION,
      title: "Updated sum",
      description: "Return all numbers.",
      difficulty: "MEDIUM" as const,
    };
    const response = { id: "task-id", slug: "sum", ...details, version: TASK_VERSION + 1 };
    const patch = vi
      .spyOn(httpClient, "patch")
      .mockResolvedValue({ data: response } as never);

    await programmingTaskApi.updateDetails("task-id", details);

    expect(patch).toHaveBeenCalledWith("/programming-tasks/task-id", details);
  });

  it("загружает скрытые данные только через edit endpoint", async () => {
    const task: ProgrammingTaskEditItem = {
      id: "task-id",
      slug: "sum",
      title: "Sum",
      description: "Return sum.",
      difficulty: "EASY",
      version: TASK_VERSION,
      variants: [],
    };
    const get = vi.spyOn(httpClient, "get").mockResolvedValue({ data: task } as never);

    await expect(programmingTaskApi.getForEditing("task-id")).resolves.toEqual(task);
    expect(get).toHaveBeenCalledWith("/programming-tasks/task-id/edit");
  });

  it("получает Harness по выбранному языку", async () => {
    const get = vi
      .spyOn(httpClient, "get")
      .mockResolvedValue({ data: { harnessCode: "solve(input);" } } as never);

    await expect(programmingTaskApi.getHarnessTemplate("JAVASCRIPT")).resolves.toBe(
      "solve(input);",
    );
    expect(get).toHaveBeenCalledWith("/programming-tasks/harness-templates/JAVASCRIPT");
  });

  it("удаляет задачу через DELETE endpoint", async () => {
    const remove = vi.spyOn(httpClient, "delete").mockResolvedValue({} as never);

    await expect(programmingTaskApi.delete("task-id")).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith("/programming-tasks/task-id");
  });
});

describe("programmingTaskApi.listBank", () => {
  it("объединяет проверенные языковые варианты одной задачи", async () => {
    const task = {
      id: "task-id",
      slug: "sum",
      title: "Sum",
      description: "Return sum.",
      difficulty: "EASY" as const,
    };
    const list = vi
      .spyOn(programmingTaskApi, "list")
      .mockImplementation((language) => Promise.resolve(language === "TYPESCRIPT" ? [] : [task]));

    await expect(programmingTaskApi.listBank()).resolves.toEqual([
      expect.objectContaining({
        id: "task-id",
        languages: ["PYTHON", "JAVASCRIPT"],
      }),
    ]);
    expect(list).toHaveBeenCalledTimes(3);
  });
});
