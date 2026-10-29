"use client";

import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  programmingTaskApi,
  TASK_LANGUAGES,
  type CreateProgrammingTaskResponse,
  type ProgrammingTaskDifficulty,
  type ProgrammingTaskEditItem,
  type ProgrammingTaskLanguage,
} from "@/entities/programming-task";
import { PROGRAMMING_TASK_DIFFICULTY_KEYS } from "@/entities/programming-task/difficulty";
import { useCurrentUser } from "@/entities/user";
import { getHttpMessage, getHttpStatus } from "@/shared/api/http-client";
import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { FieldLabelWithTooltip } from "@/shared/ui/field-label-with-tooltip";
import {
  createDrafts,
  createEmptyVariantDraft,
  getLanguageSlotState,
  parseTestCaseDrafts,
  reconcileDraftsWithServer,
  reconcileSelectedVariantId,
  type EditableVariant,
  type ParsedTestCase,
  type TestCaseDraft,
  type VariantDraft,
} from "./edit-task-flow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { LocalizedLink } from "@/shared/ui/localized-link";
import { Textarea } from "@/shared/ui/textarea";

const DIFFICULTIES: ProgrammingTaskDifficulty[] = ["EASY", "MEDIUM", "HARD"];
const LANGUAGE_KEYS = {
  PYTHON: "python",
  JAVASCRIPT: "javascript",
  TYPESCRIPT: "typescript",
} as const;
const STATUS_KEYS = {
  DRAFT: "statusDraft",
  VERIFYING: "statusVerifying",
  VERIFIED: "statusVerified",
  FAILED: "statusFailed",
} as const;
const MIN_TEST_CASE_COUNT = 1;
const TEST_CASE_INDEX_OFFSET = 1;
const HTTP_CONFLICT = 409;
const DETAILS_STEP = 1;
const IMPLEMENTATION_STEP = 2;

/** Свойства страницы редактирования. */
interface EditTaskPageProps {
  /** Идентификатор редактируемой задачи. */
  taskId: string;
}

/** Свойства короткого сообщения вместо страницы. */
interface PageMessageProps {
  /** Текст сообщения. */
  children: string;
  /** Показывать сообщение как ошибку. */
  destructive?: boolean;
}

/**
 * Компактное состояние загрузки или ошибки в общей геометрии страницы.
 * @param {PageMessageProps} props - Текст и визуальный тип сообщения.
 * @returns {import("react").ReactNode} Сообщение вместо содержимого страницы.
 */
function PageMessage(props: PageMessageProps) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <p className={props.destructive ? "text-destructive" : "text-muted-foreground"}>
        {props.children}
      </p>
    </main>
  );
}

/** Свойства заполненной формы. */
interface EditTaskFormProps {
  /** Загруженная задача со всеми вариантами. */
  task: ProgrammingTaskEditItem;
}

/** Свойства подтверждения удаления задачи. */
interface DeleteTaskDialogProps {
  /** Идентификатор удаляемой задачи. */
  taskId: string;
}

/**
 * Показывает необратимое удаление задачи только после явного подтверждения.
 * @param {DeleteTaskDialogProps} props - Идентификатор задачи.
 * @returns {import("react").ReactNode} Кнопка и диалог подтверждения.
 */
function DeleteTaskDialog(props: DeleteTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("taskBank");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    /**
     * Удаляет текущую задачу.
     * @returns {Promise<void>} Завершается после ответа backend.
     */
    mutationFn: () => programmingTaskApi.delete(props.taskId),
    /** Очищает кэш и возвращает администратора в банк задач. */
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["programming-task-bank"] });
      queryClient.removeQueries({ queryKey: ["programming-task-edit", props.taskId] });
      router.replace(getLocalizedHref("/tasks", locale));
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          deleteMutation.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="destructive">
          <Trash2 className="size-4" aria-hidden />
          {t("deleteTask")}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("close")}>
        <DialogHeader>
          <DialogTitle>{t("deleteTaskTitle")}</DialogTitle>
          <DialogDescription>{t("deleteTaskDescription")}</DialogDescription>
        </DialogHeader>
        {deleteMutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            {getHttpMessage(deleteMutation.error) || t("deleteTaskError")}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("deleteTaskCancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? t("deletingTask") : t("deleteTask")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Управляемая форма редактирования общей задачи и выбранного варианта.
 * @param {EditTaskFormProps} props - Загруженная задача.
 * @returns {import("react").ReactNode} Форма администратора.
 */
function EditTaskForm(props: EditTaskFormProps) {
  const { task } = props;
  const t = useTranslations("taskBank");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const nextCaseKey = useRef(0);
  const lastSynchronizedTask = useRef(task);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [difficulty, setDifficulty] = useState(task.difficulty);
  const [taskUpdatedAt, setTaskUpdatedAt] = useState(task.updatedAt);
  const [variants, setVariants] = useState<EditableVariant[]>(task.variants);
  const [selectedVariantId, setSelectedVariantId] = useState(task.variants[0]?.id ?? "");
  const [drafts, setDrafts] = useState(() => createDrafts(task));
  const [newLanguage, setNewLanguage] = useState<ProgrammingTaskLanguage | "">("");
  const [newDraft, setNewDraft] = useState<VariantDraft>(createEmptyVariantDraft);
  const [pendingNewVariantId, setPendingNewVariantId] = useState<string | null>(null);
  const [showLanguageError, setShowLanguageError] = useState(false);
  const [showHarnessLoadError, setShowHarnessLoadError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isDetailsDirty, setIsDetailsDirty] = useState(false);
  const [dirtyVariantIds, setDirtyVariantIds] = useState<Set<string>>(() => new Set());
  const [isNewVariantDirty, setIsNewVariantDirty] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [step, setStep] = useState<typeof DETAILS_STEP | typeof IMPLEMENTATION_STEP>(DETAILS_STEP);
  const isAddingVariant = selectedVariantId === "";
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);
  const selectedDraft = isAddingVariant ? newDraft : drafts[selectedVariantId];
  const hasUnsavedChanges = isDetailsDirty || isNewVariantDirty || dirtyVariantIds.size > 0;

  useEffect(() => {
    if (lastSynchronizedTask.current === task) {
      return;
    }
    lastSynchronizedTask.current = task;

    if (!isDetailsDirty) {
      setTitle(task.title);
      setDescription(task.description);
      setDifficulty(task.difficulty);
      setTaskUpdatedAt(task.updatedAt);
    }

    setDrafts((current) =>
      reconcileDraftsWithServer({ task, currentDrafts: current, dirtyVariantIds }),
    );
    setVariants(task.variants);
    setSelectedVariantId((current) =>
      reconcileSelectedVariantId({ currentSelectedVariantId: current, variants: task.variants }),
    );
  }, [task]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    /**
     * Просит браузер подтвердить закрытие страницы с несохранёнными данными.
     * @param {BeforeUnloadEvent} event - Событие закрытия или перезагрузки вкладки.
     */
    function handleBeforeUnload(event: BeforeUnloadEvent): void {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  /** Помечает выбранный языковой вариант как изменённый. */
  function markSelectedVariantDirty(): void {
    if (isAddingVariant) {
      setIsNewVariantDirty(true);

      return;
    }

    setDirtyVariantIds((current) => new Set(current).add(selectedVariantId));
  }

  /**
   * Снимает признак несохранённых изменений с варианта после ответа backend.
   * @param {string} variantId - Идентификатор сохранённого варианта.
   * @param {boolean} wasNewVariant - Был ли вариант новым до сохранения.
   */
  function markVariantSaved(variantId: string, wasNewVariant: boolean): void {
    if (wasNewVariant) {
      setIsNewVariantDirty(false);
    }

    setDirtyVariantIds((current) => {
      if (!current.has(variantId)) {
        return current;
      }

      const next = new Set(current);
      next.delete(variantId);

      return next;
    });
  }

  /**
   * Обновляет часть черновика выбранного варианта.
   * @param {Partial<VariantDraft>} patch - Изменившиеся поля.
   */
  function updateSelectedDraft(patch: Partial<VariantDraft>): void {
    markSelectedVariantDirty();

    if (isAddingVariant) {
      setNewDraft((current) => ({ ...current, ...patch }));

      return;
    }

    setDrafts((current) => ({
      ...current,
      [selectedVariantId]: { ...current[selectedVariantId], ...patch } as VariantDraft,
    }));
  }

  /** Открывает чистую форму для следующего неиспользованного языка. */
  function startAddingVariant(): void {
    setSelectedVariantId("");
    setNewLanguage("");
    setNewDraft(createEmptyVariantDraft());
    setPendingNewVariantId(null);
    setShowLanguageError(false);
    setShowHarnessLoadError(false);
    setSubmitError("");
  }

  /**
   * Выбирает язык нового варианта и загружает его стандартный Harness.
   * @param {ProgrammingTaskLanguage} language - Язык нового варианта.
   */
  async function selectNewLanguage(language: ProgrammingTaskLanguage): Promise<void> {
    if (pendingNewVariantId && language !== newLanguage) {
      return;
    }

    setNewLanguage(language);
    setIsNewVariantDirty(true);
    setShowLanguageError(false);
    setShowHarnessLoadError(false);
    setNewDraft((current) =>
      language === newLanguage
        ? { ...current, harnessCode: "" }
        : { ...createEmptyVariantDraft(), harnessCode: "" },
    );

    try {
      const harnessCode = await programmingTaskApi.getHarnessTemplate(language);
      setNewDraft((current) => ({ ...current, harnessCode }));
    } catch {
      setShowHarnessLoadError(true);
    }
  }

  /**
   * Переключает существующую реализацию или открывает форму неиспользованного стека.
   * @param {ProgrammingTaskLanguage} language - Выбранный язык реализации.
   */
  function selectImplementationLanguage(language: ProgrammingTaskLanguage): void {
    const existingVariant = variants.find((variant) => variant.language === language);
    if (existingVariant) {
      if (pendingNewVariantId) {
        return;
      }

      setSelectedVariantId(existingVariant.id);
      setSubmitError("");
      setSubmitSuccess("");

      return;
    }

    if (!isAddingVariant) {
      startAddingVariant();
    }

    void selectNewLanguage(language);
  }

  /**
   * Обновляет одно поле тест-кейса.
   * @param {string} key - Локальный ключ теста.
   * @param {Partial<TestCaseDraft>} patch - Изменившиеся поля.
   */
  function updateTestCase(key: string, patch: Partial<TestCaseDraft>): void {
    if (!selectedDraft) {
      return;
    }

    updateSelectedDraft({
      testCases: selectedDraft.testCases.map((testCase) =>
        testCase.key === key ? { ...testCase, ...patch } : testCase,
      ),
    });
  }

  /** Добавляет пустой тест-кейс. */
  function addTestCase(): void {
    if (!selectedDraft) {
      return;
    }

    nextCaseKey.current += TEST_CASE_INDEX_OFFSET;
    updateSelectedDraft({
      testCases: [
        ...selectedDraft.testCases,
        { key: `new-${nextCaseKey.current}`, input: "", expectedOutput: "" },
      ],
    });
  }

  /**
   * Удаляет тест-кейс, если он не единственный.
   * @param {string} key - Локальный ключ удаляемого теста.
   */
  function removeTestCase(key: string): void {
    if (!selectedDraft || selectedDraft.testCases.length === MIN_TEST_CASE_COUNT) {
      return;
    }

    updateSelectedDraft({ testCases: selectedDraft.testCases.filter((item) => item.key !== key) });
  }

  /** Проверяет общие поля и переходит к реализации. */
  function goToImplementation(): void {
    if (formRef.current?.reportValidity()) {
      setSubmitError("");
      setSubmitSuccess("");
      setStep(IMPLEMENTATION_STEP);
    }
  }

  /** Сохраняет название, описание и сложность без запуска Code Runner. */
  async function saveDetails(): Promise<void> {
    if (!formRef.current?.reportValidity()) {
      return;
    }

    setIsSavingDetails(true);
    setSubmitError("");
    setSubmitSuccess("");
    try {
      const updatedTask = await programmingTaskApi.updateDetails(task.id, {
        expectedUpdatedAt: taskUpdatedAt,
        title,
        description,
        difficulty,
      });
      setTitle(updatedTask.title);
      setDescription(updatedTask.description);
      setDifficulty(updatedTask.difficulty);
      setTaskUpdatedAt(updatedTask.updatedAt);
      setIsDetailsDirty(false);
      setSubmitSuccess(t("detailsSaved"));
      await queryClient.invalidateQueries({ queryKey: ["programming-task-bank"] });
      await queryClient.invalidateQueries({ queryKey: ["programming-task-edit", task.id] });
    } catch (error) {
      setSubmitError(
        getHttpStatus(error) === HTTP_CONFLICT
          ? t("editConflict")
          : getHttpMessage(error) || t("editError"),
      );
    } finally {
      setIsSavingDetails(false);
    }
  }

  /**
   * Сохраняет поля и повторно проверяет эталонное решение.
   * @param {FormEvent<HTMLFormElement>} event - Отправка формы.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (step !== IMPLEMENTATION_STEP || !selectedDraft || (!isAddingVariant && !selectedVariant)) {
      return;
    }

    if (isAddingVariant && !newLanguage) {
      setShowLanguageError(true);

      return;
    }

    let testCases: ParsedTestCase[];
    try {
      testCases = parseTestCaseDrafts(selectedDraft.testCases, t("testCaseName"));
    } catch {
      setSubmitSuccess("");
      setSubmitError(t("invalidTestCaseJson"));

      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");
    try {
      const language = isAddingVariant ? newLanguage : selectedVariant?.language;
      if (!language) {
        return;
      }
      const input = {
        language,
        starterCode: selectedDraft.starterCode,
        harnessCode: selectedDraft.harnessCode,
        referenceSolution: selectedDraft.referenceSolution,
        testCases,
      };
      let result: CreateProgrammingTaskResponse;
      if (isAddingVariant) {
        result = pendingNewVariantId
          ? await programmingTaskApi.reverify(task.id, pendingNewVariantId, input)
          : await programmingTaskApi.addVariant(task.id, input);
      } else if (selectedVariant) {
        result = await programmingTaskApi.reverify(task.id, selectedVariant.id, input);
      } else {
        return;
      }
      markVariantSaved(result.variantId, isAddingVariant);

      if (result.status === "VERIFYING") {
        if (isAddingVariant) {
          setPendingNewVariantId(result.variantId);
        } else {
          setVariants((current) =>
            current.map((variant) =>
              variant.id === result.variantId ? { ...variant, status: "VERIFYING" } : variant,
            ),
          );
        }
        setSubmitSuccess(t("verifying"));
        result = await programmingTaskApi.waitForVerification(task.id, result.variantId);
        setSubmitSuccess("");
      }

      if (result.status === "FAILED") {
        if (isAddingVariant) {
          setPendingNewVariantId(result.variantId);
        } else {
          setVariants((current) =>
            current.map((variant) =>
              variant.id === result.variantId
                ? {
                  ...variant,
                  status: "FAILED",
                  verifiedAt: null,
                  lastVerificationError: result.verificationError,
                }
                : variant,
            ),
          );
        }
        setSubmitError(
          result.verificationError
            ? `${t("verificationFailed")} ${result.verificationError}`
            : t("verificationFailed"),
        );
        await queryClient.invalidateQueries({ queryKey: ["programming-task-bank"] });
        await queryClient.invalidateQueries({ queryKey: ["programming-task-edit", task.id] });

        return;
      }

      const freshTask = await programmingTaskApi.getForEditing(task.id);
      const savedVariant = freshTask.variants.find((variant) => variant.id === result.variantId);
      if (!savedVariant) {
        throw new Error("Programming task variant was not found");
      }

      setVariants((current) =>
        current.some((variant) => variant.id === savedVariant.id)
          ? current.map((variant) => (variant.id === savedVariant.id ? savedVariant : variant))
          : [...current, savedVariant],
      );

      if (isAddingVariant) {
        setPendingNewVariantId(null);
        setDrafts((current) => ({ ...current, [result.variantId]: selectedDraft }));
        setSelectedVariantId(result.variantId);
      }
      setSubmitSuccess(t("editSuccess"));
      await queryClient.invalidateQueries({ queryKey: ["programming-task-bank"] });
      await queryClient.invalidateQueries({ queryKey: ["programming-task-edit", task.id] });
    } catch (error) {
      setSubmitSuccess("");
      setSubmitError(getHttpMessage(error) || t("editError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if ((!selectedVariant && !isAddingVariant) || !selectedDraft) {
    return <PageMessage destructive>{t("noTaskVariants")}</PageMessage>;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 md:py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("editTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t("editDescription")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DeleteTaskDialog taskId={task.id} />
          <Button asChild variant="outline">
            <LocalizedLink
              href="/tasks"
              onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                if (!hasUnsavedChanges) {
                  return;
                }

                event.preventDefault();
                setIsLeaveDialogOpen(true);
              }}
            >
              {t("backToTasks")}
            </LocalizedLink>
          </Button>
        </div>
      </div>

      <ol className="mt-8 grid grid-cols-2 gap-3" aria-label={t("editingProgress")}>
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
            <Label htmlFor="edit-task-title">{t("name")}</Label>
            <Input
              id="edit-task-title"
              required
              disabled={isSavingDetails}
              value={title}
              placeholder={t.raw("namePlaceholder")}
              onChange={(event) => {
                setTitle(event.target.value);
                setIsDetailsDirty(true);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-task-description">{t("taskDescription")}</Label>
            <Textarea
              id="edit-task-description"
              required
              disabled={isSavingDetails}
              rows={6}
              value={description}
              placeholder={t.raw("descriptionPlaceholder")}
              onChange={(event) => {
                setDescription(event.target.value);
                setIsDetailsDirty(true);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("difficulty")}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSavingDetails}
                  className="h-11 w-full justify-between bg-background px-3 font-normal"
                >
                  {commonT(PROGRAMMING_TASK_DIFFICULTY_KEYS[difficulty])}
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
                      setIsDetailsDirty(true);
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
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSavingDetails}
              onClick={() => void saveDetails()}
            >
              {isSavingDetails ? t("saving") : t("save")}
            </Button>
            <Button type="button" onClick={goToImplementation}>
              {t("next")}
            </Button>
          </div>
        </section>

        <section hidden={step !== IMPLEMENTATION_STEP} className="space-y-6">
          <div className="space-y-2">
            <Label>{t("stack")}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full justify-between bg-background px-3 font-normal"
                  aria-invalid={showLanguageError || undefined}
                >
                  {isAddingVariant
                    ? (
                      newLanguage
                        ? (
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-xs uppercase tracking-wide">
                              {t(LANGUAGE_KEYS[newLanguage])}
                            </span>
                            <span
                              className={
                                pendingNewVariantId
                                  ? "text-xs text-destructive"
                                  : "text-xs text-muted-foreground"
                              }
                            >
                              {pendingNewVariantId ? t("statusFailed") : t("statusNotImplemented")}
                            </span>
                          </span>
                        )
                        : (
                          <span className="text-muted-foreground">{t("selectStackPlaceholder")}</span>
                        )
                    )
                    : (
                      selectedVariant && (
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-xs uppercase tracking-wide">
                            {t(LANGUAGE_KEYS[selectedVariant.language])}
                          </span>
                          <span
                            className={
                              selectedVariant.status === "VERIFIED"
                                ? "text-xs text-success"
                                : selectedVariant.status === "FAILED"
                                  ? "text-xs text-destructive"
                                  : "text-xs text-muted-foreground"
                            }
                          >
                            {t(STATUS_KEYS[selectedVariant.status])}
                          </span>
                        </span>
                      )
                    )}
                  <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[var(--radix-dropdown-menu-trigger-width)]"
              >
                {TASK_LANGUAGES.map((language) => {
                  const variant = variants.find((item) => item.language === language);
                  const { isPendingFailedLanguage, isSelectionBlocked, statusClass } =
                    getLanguageSlotState({ variant, pendingNewVariantId, newLanguage, language });

                  return (
                    <DropdownMenuItem
                      key={language}
                      aria-disabled={isSelectionBlocked}
                      onSelect={(event) => {
                        if (isSelectionBlocked) {
                          event.preventDefault();

                          return;
                        }

                        selectImplementationLanguage(language);
                      }}
                    >
                      <span className="flex flex-1 items-center justify-between gap-3">
                        <span className="font-mono text-xs uppercase tracking-wide">
                          {t(LANGUAGE_KEYS[language])}
                        </span>
                        <span className={`text-xs ${statusClass}`}>
                          {variant
                            ? t(STATUS_KEYS[variant.status])
                            : isPendingFailedLanguage
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
          </div>

          <div className="space-y-2">
            <FieldLabelWithTooltip
              htmlFor="edit-starting-code"
              label={t("startingCode")}
              hint={t("startingCodeHint")}
            />
            <Textarea
              id="edit-starting-code"
              required
              disabled={step !== IMPLEMENTATION_STEP}
              rows={8}
              className="font-mono"
              value={selectedDraft.starterCode}
              placeholder={t.raw("startingCodePlaceholder")}
              onChange={(event) => updateSelectedDraft({ starterCode: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <FieldLabelWithTooltip
              htmlFor="edit-harness"
              label={t("harness")}
              hint={t("harnessHint")}
            />
            <Textarea
              id="edit-harness"
              required
              disabled={step !== IMPLEMENTATION_STEP}
              rows={10}
              className="font-mono"
              value={selectedDraft.harnessCode}
              placeholder={t.raw("harnessPlaceholder")}
              onChange={(event) => updateSelectedDraft({ harnessCode: event.target.value })}
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

            {selectedDraft.testCases.map((testCase, index) => (
              <div
                key={testCase.key}
                className="relative grid gap-2 rounded-lg border bg-background p-3 sm:grid-cols-2"
              >
                <div className="space-y-2">
                  <Label htmlFor={`edit-input-${testCase.key}`}>
                    {t("testCase")} {index + TEST_CASE_INDEX_OFFSET}
                  </Label>
                  <Input
                    id={`edit-input-${testCase.key}`}
                    required
                    disabled={step !== IMPLEMENTATION_STEP}
                    value={testCase.input}
                    placeholder={t.raw("testCaseInputPlaceholder")}
                    onChange={(event) =>
                      updateTestCase(testCase.key, { input: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`edit-output-${testCase.key}`}>{t("expectedOutput")}</Label>
                  <Input
                    id={`edit-output-${testCase.key}`}
                    required
                    disabled={step !== IMPLEMENTATION_STEP}
                    value={testCase.expectedOutput}
                    placeholder={t.raw("expectedOutputPlaceholder")}
                    onChange={(event) =>
                      updateTestCase(testCase.key, { expectedOutput: event.target.value })
                    }
                  />
                </div>
                {selectedDraft.testCases.length > MIN_TEST_CASE_COUNT && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={`absolute -top-2 -right-2 size-7 rounded-full bg-background
                    text-muted-foreground shadow-sm hover:text-destructive`}
                    aria-label={`${t("removeTestCase")} ${index + TEST_CASE_INDEX_OFFSET}`}
                    onClick={() => removeTestCase(testCase.key)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <FieldLabelWithTooltip
              htmlFor="edit-reference-solution"
              label={t("sampleCode")}
              hint={t("sampleCodeHint")}
            />
            <Textarea
              id="edit-reference-solution"
              required
              disabled={step !== IMPLEMENTATION_STEP}
              rows={10}
              className="font-mono"
              value={selectedDraft.referenceSolution}
              placeholder={t.raw("sampleCodePlaceholder")}
              onChange={(event) => updateSelectedDraft({ referenceSolution: event.target.value })}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setStep(DETAILS_STEP)}>
              {t("back")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("verifying") : t("saveAndVerify")}
            </Button>
          </div>
        </section>
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
      </form>

      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent closeLabel={t("close")}>
          <DialogHeader>
            <DialogTitle>{t("unsavedChangesTitle")}</DialogTitle>
            <DialogDescription>{t("unsavedChangesDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsLeaveDialogOpen(false)}>
              {t("stayOnPage")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => router.push(getLocalizedHref("/tasks", locale))}
            >
              {t("leaveWithoutSaving")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

/**
 * Загружает полные данные задачи и ограничивает доступ администраторами.
 * @param {EditTaskPageProps} props - Идентификатор задачи из route.
 * @returns {import("react").ReactNode} Форма редактирования или состояние загрузки.
 */
export function EditTaskPage(props: EditTaskPageProps) {
  const t = useTranslations("taskBank");
  const currentUserQuery = useCurrentUser();
  const taskQuery = useQuery({
    queryKey: ["programming-task-edit", props.taskId],
    // eslint-disable-next-line jsdoc/require-jsdoc
    queryFn: () => programmingTaskApi.getForEditing(props.taskId),
    enabled: currentUserQuery.data?.isAdmin === true,
  });

  if (currentUserQuery.isPending) {
    return <PageMessage>{t("loading")}</PageMessage>;
  }
  if (!currentUserQuery.data?.isAdmin) {
    return <PageMessage destructive>{t("editAccessDenied")}</PageMessage>;
  }
  if (taskQuery.isPending) {
    return <PageMessage>{t("loading")}</PageMessage>;
  }
  if (taskQuery.isError || !taskQuery.data) {
    return <PageMessage destructive>{t("editLoadError")}</PageMessage>;
  }

  return <EditTaskForm task={taskQuery.data} />;
}
