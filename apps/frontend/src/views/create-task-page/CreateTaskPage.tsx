"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";

import {
  programmingTaskApi,
  TASK_LANGUAGES,
  type ProgrammingTaskDifficulty,
  type ProgrammingTaskLanguage,
} from "@/entities/programming-task";
import { PROGRAMMING_TASK_DIFFICULTY_KEYS } from "@/entities/programming-task/difficulty";
import { useCurrentUser } from "@/entities/user";
import { getHttpMessage } from "@/shared/api/http-client";
import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { FieldLabelWithTooltip } from "@/shared/ui/field-label-with-tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { canAddAnotherLanguage } from "./create-task-flow";

const LANGUAGE_KEYS = {
  PYTHON: "python",
  JAVASCRIPT: "javascript",
  TYPESCRIPT: "typescript",
} as const;
const DIFFICULTIES: ProgrammingTaskDifficulty[] = ["EASY", "MEDIUM", "HARD"];
const DETAILS_STEP = 1;
const IMPLEMENTATION_STEP = 2;
const TEST_CASE_INDEX_OFFSET = 1;
const MIN_TEST_CASE_COUNT = 1;

/** Редактируемые значения одного скрытого тест-кейса. */
interface TestCaseDraft {
  /** Локальный идентификатор строки формы. */
  id: number;
  /** JSON-вход в текстовом виде. */
  input: string;
  /** Ожидаемый JSON-результат в текстовом виде. */
  expectedOutput: string;
}

/**
 * Создаёт начальный пустой тест-кейс.
 * @returns {TestCaseDraft[]} Массив с одной строкой тест-кейса.
 */
function createInitialTestCases(): TestCaseDraft[] {
  return [{ id: 0, input: "", expectedOutput: "" }];
}

/**
 * Экран создания задачи, доступный только администраторам.
 * @returns {import("react").ReactNode} Многошаговая форма или сообщение об ограничении доступа.
 */
export function CreateTaskPage() {
  const t = useTranslations("taskBank");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const currentUserQuery = useCurrentUser();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<typeof DETAILS_STEP | typeof IMPLEMENTATION_STEP>(DETAILS_STEP);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState<ProgrammingTaskLanguage | "">("");
  const [difficulty, setDifficulty] = useState<ProgrammingTaskDifficulty | "">("");
  const [starterCode, setStarterCode] = useState("");
  const [referenceSolution, setReferenceSolution] = useState("");
  const [showDifficultyError, setShowDifficultyError] = useState(false);
  const [showLanguageError, setShowLanguageError] = useState(false);
  const [showHarnessLoadError, setShowHarnessLoadError] = useState(false);
  const [testCases, setTestCases] = useState<TestCaseDraft[]>(createInitialTestCases);
  const [harnesses, setHarnesses] = useState<Partial<Record<ProgrammingTaskLanguage, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [usedLanguages, setUsedLanguages] = useState<ProgrammingTaskLanguage[]>([]);
  const [createdVariant, setCreatedVariant] = useState<{
    /** Задача, к которой относится не прошедший проверку вариант. */
    taskId: string;
    /** Вариант, который нужно повторно проверить без создания дубля. */
    variantId: string;
  } | null>(null);
  const hasNextLanguage = canAddAnotherLanguage(usedLanguages);

  /** Проверяет первый шаг и открывает настройки реализации. */
  function goToImplementation(): void {
    const detailsAreValid = formRef.current?.reportValidity() ?? false;
    const difficultyIsValid = difficulty !== "";

    setShowDifficultyError(!difficultyIsValid);
    if (detailsAreValid && difficultyIsValid) {
      setStep(IMPLEMENTATION_STEP);
    }
  }

  /** Добавляет ещё одну пару полей тест-кейса. */
  function addTestCase(): void {
    setTestCases((current) => [
      ...current,
      {
        id: Math.max(...current.map((testCase) => testCase.id)) + TEST_CASE_INDEX_OFFSET,
        input: "",
        expectedOutput: "",
      },
    ]);
  }

  /**
   * Удаляет тест-кейс.
   * @param {number} id - Локальный идентификатор тест-кейса.
   */
  function removeTestCase(id: number): void {
    setTestCases((current) => current.filter((testCase) => testCase.id !== id));
  }

  /**
   * Обновляет контролируемые значения одного тест-кейса.
   * @param {number} id - Локальный идентификатор тест-кейса.
   * @param {Partial<Omit<TestCaseDraft, "id">>} patch - Изменённые поля тест-кейса.
   */
  function updateTestCase(id: number, patch: Partial<Omit<TestCaseDraft, "id">>): void {
    setTestCases((current) =>
      current.map((testCase) => (testCase.id === id ? { ...testCase, ...patch } : testCase)),
    );
  }

  /** Очищает реализацию перед выбором следующего языка. */
  function resetImplementation(): void {
    setStarterCode("");
    setReferenceSolution("");
    setTestCases(createInitialTestCases());
  }

  /**
   * Выбирает язык и при первом выборе загружает его Harness с backend.
   * @param {ProgrammingTaskLanguage} selectedLanguage - Язык реализации.
   */
  async function selectLanguage(selectedLanguage: ProgrammingTaskLanguage): Promise<void> {
    if (createdVariant && language !== selectedLanguage) {
      return;
    }

    if (language && language !== selectedLanguage) {
      resetImplementation();
    }

    setLanguage(selectedLanguage);
    setShowLanguageError(false);
    setShowHarnessLoadError(false);
    setSubmitError("");
    setSubmitSuccess("");

    if (harnesses[selectedLanguage] === undefined) {
      try {
        const harnessCode = await programmingTaskApi.getHarnessTemplate(selectedLanguage);
        setHarnesses((current) => ({ ...current, [selectedLanguage]: harnessCode }));
      } catch {
        setShowHarnessLoadError(true);
      }
    }
  }

  /**
   * Проверяет выбор языка перед отправкой формы.
   * @param {FormEvent<HTMLFormElement>} event - Событие отправки формы.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const shouldAddAnotherLanguage =
      submitter instanceof HTMLButtonElement && submitter.dataset.action === "next";

    const languageIsValid = language !== "";
    setShowLanguageError(!languageIsValid);
    if (!languageIsValid || difficulty === "") {
      return;
    }

    let parsedTestCases: Array<{
      /** Распарсенный JSON-вход. */
      input: unknown;
      /** Распарсенный ожидаемый JSON-результат. */
      expectedOutput: unknown;
    }>;
    try {
      parsedTestCases = testCases.map((testCase) => ({
        input: JSON.parse(testCase.input) as unknown,
        expectedOutput: JSON.parse(testCase.expectedOutput) as unknown,
      }));
    } catch {
      setSubmitError(t("invalidTestCaseJson"));

      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");
    try {
      const variantInput = {
        language,
        starterCode,
        harnessCode: harnesses[language] ?? "",
        referenceSolution,
        testCases: parsedTestCases.map((testCase, index) => ({
          name: `${t("testCaseName")} ${index + TEST_CASE_INDEX_OFFSET}`,
          ...testCase,
        })),
      };
      let result = createdVariant
        ? await programmingTaskApi.reverify(
          createdVariant.taskId,
          createdVariant.variantId,
          variantInput,
        )
        : createdTaskId
          ? await programmingTaskApi.addVariant(createdTaskId, variantInput)
          : await programmingTaskApi.create({
            title,
            description,
            difficulty,
            ...variantInput,
          });

      setCreatedTaskId(result.id);
      setCreatedVariant({ taskId: result.id, variantId: result.variantId });
      if (result.status === "VERIFYING") {
        setSubmitSuccess(t("verifying"));
        result = await programmingTaskApi.waitForVerification(result.id, result.variantId);
        setSubmitSuccess("");
      }

      if (result.status === "VERIFIED") {
        setCreatedTaskId(result.id);
        setCreatedVariant(null);

        if (shouldAddAnotherLanguage && hasNextLanguage) {
          setUsedLanguages((current) => [...current, language]);
          setLanguage("");
          resetImplementation();
          setShowLanguageError(false);
          setShowHarnessLoadError(false);
          setSubmitSuccess(t("languageVariantSaved"));

          return;
        }

        router.push(getLocalizedHref("/tasks", locale));
        router.refresh();

        return;
      }

      setSubmitError(
        result.verificationError
          ? `${t("verificationFailed")} ${result.verificationError}`
          : t("verificationFailed"),
      );
      setCreatedVariant({ taskId: result.id, variantId: result.variantId });
    } catch (error) {
      const backendMessage = getHttpMessage(error);
      setSubmitSuccess("");
      setSubmitError(backendMessage || t("createError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (currentUserQuery.isPending) {
    return <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">{t("loading")}</main>;
  }

  if (!currentUserQuery.data?.isAdmin) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <p className="text-destructive">{t("accessDenied")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 md:py-16">
      <h1 className="text-3xl font-bold tracking-tight">{t("createTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("createDescription")}</p>

      <ol className="mt-8 grid grid-cols-2 gap-3" aria-label={t("creationProgress")}>
        {[DETAILS_STEP, IMPLEMENTATION_STEP].map((item) => (
          <li
            key={item}
            className={`border-t-2 pt-3 text-xs font-medium uppercase tracking-wide ${
              step === item ? "border-primary text-primary" : "border-border text-muted-foreground"
            }`}
            aria-current={step === item ? "step" : undefined}
          >
            {item === DETAILS_STEP ? t("detailsStep") : t("implementationStep")}
          </li>
        ))}
      </ol>

      <form
        ref={formRef}
        className="mt-6 rounded-xl border bg-card p-6"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <section hidden={step !== DETAILS_STEP} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="task-title">{t("name")}</Label>
            <Input
              id="task-title"
              name="title"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t.raw("namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">{t("taskDescription")}</Label>
            <Textarea
              id="task-description"
              name="description"
              required
              rows={6}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t.raw("descriptionPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("difficulty")}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full justify-between bg-background px-3 font-normal"
                  aria-invalid={showDifficultyError || undefined}
                >
                  <span className={difficulty ? "text-foreground" : "text-muted-foreground"}>
                    {difficulty
                      ? commonT(PROGRAMMING_TASK_DIFFICULTY_KEYS[difficulty])
                      : t("difficultyPlaceholder")}
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[var(--radix-dropdown-menu-trigger-width)]"
              >
                {DIFFICULTIES.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onSelect={() => {
                      setDifficulty(option);
                      setShowDifficultyError(false);
                    }}
                  >
                    <span className="flex-1">
                      {commonT(PROGRAMMING_TASK_DIFFICULTY_KEYS[option])}
                    </span>
                    {difficulty === option && <Check className="size-4 text-primary" aria-hidden />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {showDifficultyError && (
              <p className="text-sm text-destructive">{t("selectDifficulty")}</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" onClick={goToImplementation}>
              {t("next")}
            </Button>
          </div>
        </section>

        <section hidden={step !== IMPLEMENTATION_STEP} className="space-y-6">
          <fieldset className="space-y-2">
            <Label>{t("stack")}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full justify-between bg-background px-3 font-normal"
                  aria-invalid={showLanguageError || undefined}
                >
                  {language
                    ? (
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs uppercase tracking-wide">
                          {t(LANGUAGE_KEYS[language])}
                        </span>
                        <span
                          className={
                            createdVariant
                              ? "text-xs text-destructive"
                              : "text-xs text-muted-foreground"
                          }
                        >
                          {createdVariant ? t("statusFailed") : t("statusNotImplemented")}
                        </span>
                      </span>
                    )
                    : (
                      <span className="text-muted-foreground">{t("selectStackPlaceholder")}</span>
                    )}
                  <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[var(--radix-dropdown-menu-trigger-width)]"
              >
                {TASK_LANGUAGES.map((option) => {
                  const isVerified = usedLanguages.includes(option);
                  const isFailed = createdVariant !== null && language === option;
                  const isSelectionBlocked =
                    isVerified || (createdVariant !== null && language !== option);

                  return (
                    <DropdownMenuItem
                      key={option}
                      aria-disabled={isSelectionBlocked}
                      onSelect={(event) => {
                        if (isSelectionBlocked) {
                          event.preventDefault();

                          return;
                        }

                        void selectLanguage(option);
                      }}
                    >
                      <span className="flex flex-1 items-center justify-between gap-3">
                        <span className="font-mono text-xs uppercase tracking-wide">
                          {t(LANGUAGE_KEYS[option])}
                        </span>
                        <span
                          className={`text-xs ${
                            isVerified
                              ? "text-success"
                              : isFailed
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }`}
                        >
                          {isVerified
                            ? t("statusVerified")
                            : isFailed
                              ? t("statusFailed")
                              : t("statusNotImplemented")}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            {showLanguageError && <p className="text-sm text-destructive">{t("selectLanguage")}</p>}
          </fieldset>

          <div className="space-y-2">
            <FieldLabelWithTooltip
              htmlFor="task-starting-code"
              label={t("startingCode")}
              hint={t("startingCodeHint")}
            />
            <Textarea
              id="task-starting-code"
              name="startingCode"
              required
              disabled={step !== IMPLEMENTATION_STEP}
              rows={7}
              className="font-mono"
              value={starterCode}
              onChange={(event) => setStarterCode(event.target.value)}
              placeholder={t.raw("startingCodePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <FieldLabelWithTooltip
              htmlFor="task-harness"
              label={t("harness")}
              hint={t("harnessHint")}
            />
            <Textarea
              id="task-harness"
              name="harness"
              required
              disabled={step !== IMPLEMENTATION_STEP}
              rows={8}
              className="font-mono"
              value={language ? (harnesses[language] ?? "") : ""}
              onChange={(event) => {
                if (language) {
                  setHarnesses((current) => ({
                    ...current,
                    [language]: event.target.value,
                  }));
                }
              }}
              placeholder={t.raw("harnessPlaceholder")}
            />
            {showHarnessLoadError && (
              <p className="text-sm text-destructive">{t("harnessLoadError")}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FieldLabelWithTooltip label={t("testCases")} hint={t("testCasesHint")} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                aria-label={t("addTestCase")}
                title={t("addTestCase")}
                onClick={addTestCase}
              >
                <Plus className="size-4" aria-hidden />
              </Button>
            </div>
            {testCases.map((testCase, index) => (
              <div
                key={testCase.id}
                className="relative grid gap-2 rounded-lg border bg-background p-3 sm:grid-cols-2"
              >
                <div className="space-y-2">
                  <Label htmlFor={`task-test-input-${testCase.id}`}>
                    {t("testCase")} {index + TEST_CASE_INDEX_OFFSET}
                  </Label>
                  <Input
                    id={`task-test-input-${testCase.id}`}
                    name="testCaseInputs[]"
                    required
                    disabled={step !== IMPLEMENTATION_STEP}
                    value={testCase.input}
                    onChange={(event) => updateTestCase(testCase.id, { input: event.target.value })}
                    placeholder={t.raw("testCaseInputPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`task-test-output-${testCase.id}`}>{t("expectedOutput")}</Label>
                  <Input
                    id={`task-test-output-${testCase.id}`}
                    name="expectedOutputs[]"
                    required
                    disabled={step !== IMPLEMENTATION_STEP}
                    value={testCase.expectedOutput}
                    onChange={(event) =>
                      updateTestCase(testCase.id, { expectedOutput: event.target.value })
                    }
                    placeholder={t.raw("expectedOutputPlaceholder")}
                  />
                </div>
                {testCases.length > MIN_TEST_CASE_COUNT && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={`absolute -top-2 -right-2 size-7 rounded-full bg-background
                      text-muted-foreground shadow-sm hover:text-destructive`}
                    aria-label={`${t("removeTestCase")} ${index + TEST_CASE_INDEX_OFFSET}`}
                    onClick={() => removeTestCase(testCase.id)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <FieldLabelWithTooltip
              htmlFor="task-sample-code"
              label={t("sampleCode")}
              hint={t("sampleCodeHint")}
            />
            <Textarea
              id="task-sample-code"
              name="sampleCode"
              required
              disabled={step !== IMPLEMENTATION_STEP}
              rows={8}
              className="font-mono"
              value={referenceSolution}
              onChange={(event) => setReferenceSolution(event.target.value)}
              placeholder={t.raw("sampleCodePlaceholder")}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setStep(DETAILS_STEP)}
            >
              {t("back")}
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="submit"
                data-action="finish"
                variant={hasNextLanguage ? "outline" : "default"}
                disabled={isSubmitting}
              >
                {isSubmitting ? t("verifying") : t("finishCreation")}
              </Button>
              {hasNextLanguage && (
                <Button type="submit" data-action="next" disabled={isSubmitting}>
                  {isSubmitting ? t("verifying") : t("next")}
                </Button>
              )}
            </div>
          </div>
          {submitError && (
            <p role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          )}
          {submitSuccess && (
            <p role="status" className="text-sm text-success">
              {submitSuccess}
            </p>
          )}
        </section>
      </form>
    </main>
  );
}
