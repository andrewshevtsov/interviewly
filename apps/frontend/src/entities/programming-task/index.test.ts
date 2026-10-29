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
const UPDATED_AT = "2026-10-28T12:00:00.000Z";
const verificationResponse: CreateProgrammingTaskResponse = {
  id: "task-id",
  slug: "sum",
  variantId: "variant-id",
  status: "VERIFIED",
  verificationError: null,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("programmingTaskApi admin flow", () => {
  it("ожидает финальный статус поставленного в очередь варианта", async () => {
    const task: ProgrammingTaskEditItem = {
      id: "task-id",
      slug: "sum",
      title: "Sum",
      description: "Return sum.",
      difficulty: "EASY",
      updatedAt: UPDATED_AT,
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

  it("создаёт задачу через общий endpoint", async () => {
    const post = vi
      .spyOn(httpClient, "post")
      .mockResolvedValue({ data: verificationResponse } as never);

    await expect(programmingTaskApi.create(createInput)).resolves.toEqual(verificationResponse);
    expect(post).toHaveBeenCalledWith("/programming-tasks", createInput);
  });

  it("повторно проверяет конкретный вариант, не создавая новый", async () => {
    const put = vi
      .spyOn(httpClient, "put")
      .mockResolvedValue({ data: verificationResponse } as never);

    await programmingTaskApi.reverify("task-id", "variant-id", variantInput);

    expect(put).toHaveBeenCalledWith(
      "/programming-tasks/task-id/variants/variant-id",
      variantInput,
    );
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
      expectedUpdatedAt: UPDATED_AT,
      title: "Updated sum",
      description: "Return all numbers.",
      difficulty: "MEDIUM" as const,
    };
    const response = { id: "task-id", slug: "sum", ...details, updatedAt: UPDATED_AT };
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
      updatedAt: UPDATED_AT,
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
