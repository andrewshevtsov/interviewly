import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { randomBytes } from 'node:crypto';
import type { Queue } from 'bullmq';
import {
  EditorLanguage,
  ProgrammingTaskVariantStatus,
} from '../../prisma/generated/enums.ts';
import { Prisma } from '../../prisma/generated/client.ts';
import { slugify } from '../../shared/utils/slugify.ts';
import { PROGRAMMING_TASK_VERIFICATIONS_QUEUE } from './programming-task-verification.constants.ts';
import { enqueueProgrammingTaskVerification } from './programming-task-verification.queue.ts';
import type { ProgrammingTaskVerificationJob } from './programming-task-verification.types.ts';
import type {
  CreateProgrammingTaskCaseDto,
  CreateProgrammingTaskDto,
} from './dto/create-programming-task.dto.ts';
import type { ReverifyProgrammingTaskVariantDto } from './dto/reverify-programming-task-variant.dto.ts';
import type { UpdateProgrammingTaskDetailsDto } from './dto/update-programming-task-details.dto.ts';
import type { UpsertProgrammingTaskVariantDto } from './dto/upsert-programming-task-variant.dto.ts';
import { ProgrammingTaskListItemResponse } from './entities/programming-task.entity.ts';
import { ProgrammingTasksRepository } from './programming-tasks.repository.ts';

const MAX_SLUG_CREATION_ATTEMPTS = 10;
const SLUG_SUFFIX_BYTES = 3;

@Injectable()
export class ProgrammingTasksService {
  private readonly logger = new Logger(ProgrammingTasksService.name);

  constructor(
    private readonly repository: ProgrammingTasksRepository,
    @InjectQueue(PROGRAMMING_TASK_VERIFICATIONS_QUEUE)
    private readonly verificationQueue: Queue<ProgrammingTaskVerificationJob>,
  ) {}

  async createAndVerify(authorId: string, dto: CreateProgrammingTaskDto) {
    let task: Awaited<
      ReturnType<ProgrammingTasksRepository['createWithVariant']>
    > | null = null;

    for (let attempt = 1; attempt <= MAX_SLUG_CREATION_ATTEMPTS; attempt += 1) {
      const slug = this.generateSlugCandidate(dto.title);
      try {
        task = await this.repository.createWithVariant({
          slug,
          title: dto.title,
          description: dto.description,
          difficulty: dto.difficulty,
          createdBy: { connect: { id: authorId } },
          variants: {
            create: {
              language: dto.language,
              starterCode: dto.starterCode,
              harnessCode: dto.harnessCode,
              referenceSolution: dto.referenceSolution,
              status: ProgrammingTaskVariantStatus.VERIFYING,
              createdBy: { connect: { id: authorId } },
              testCases: {
                create: dto.testCases.map((testCase, index) =>
                  this.toCaseInput(testCase, index),
                ),
              },
            },
          },
        });
        break;
      } catch (error) {
        if (!this.isSlugUniqueConflict(error)) {
          throw error;
        }
        if (attempt === MAX_SLUG_CREATION_ATTEMPTS) {
          throw new ConflictException(
            'Could not allocate a unique programming task slug',
          );
        }
      }
    }

    if (!task) {
      throw new ConflictException(
        'Could not allocate a unique programming task slug',
      );
    }
    const variant = task.variants[0];
    if (!variant) {
      throw new Error('Created programming task has no variant');
    }

    try {
      await this.enqueueVerification(variant.id, variant.updatedAt);
    } catch (error) {
      // Очередь недоступна сразу после создания: откатываем только что
      // созданную задачу, чтобы повторный POST не породил дубль с другим slug.
      await this.repository.delete(task.id);
      throw error;
    }

    return this.toVerifyingResponse({
      taskId: task.id,
      taskSlug: task.slug,
      variantId: variant.id,
    });
  }

  async addVariantAndVerify(
    taskId: string,
    authorId: string,
    dto: UpsertProgrammingTaskVariantDto,
  ) {
    const task = await this.repository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Programming task was not found');
    }
    const existingVariant = await this.repository.findVariantByLanguage(
      taskId,
      dto.language,
    );
    if (existingVariant) {
      throw new ConflictException(
        'Programming task already has a variant for this language',
      );
    }

    let variant: Awaited<
      ReturnType<ProgrammingTasksRepository['createVariantForTask']>
    >;
    try {
      variant = await this.repository.createVariantForTask({
        task: { connect: { id: taskId } },
        language: dto.language,
        starterCode: dto.starterCode,
        harnessCode: dto.harnessCode,
        referenceSolution: dto.referenceSolution,
        status: ProgrammingTaskVariantStatus.VERIFYING,
        createdBy: { connect: { id: authorId } },
        testCases: {
          create: dto.testCases.map((testCase, index) =>
            this.toCaseInput(testCase, index),
          ),
        },
      });
    } catch (error) {
      // Гонка с findVariantByLanguage выше: параллельный запрос успел создать
      // вариант для этого языка первым - конфликт БД превращаем в 409.
      if (this.isUniqueConstraintConflict(error, 'language')) {
        throw new ConflictException(
          'Programming task already has a variant for this language',
        );
      }
      throw error;
    }

    try {
      await this.enqueueVerification(variant.id, variant.updatedAt);
    } catch (error) {
      // Очередь недоступна сразу после создания варианта: удаляем его, иначе
      // повторный запрос упрётся в занятый язык и не сможет создать новую попытку.
      await this.repository.deleteVariant(variant.id);
      throw error;
    }

    return this.toVerifyingResponse({
      taskId: task.id,
      taskSlug: task.slug,
      variantId: variant.id,
    });
  }

  async updateAndVerify(
    taskId: string,
    variantId: string,
    dto: ReverifyProgrammingTaskVariantDto,
  ) {
    const existing = await this.repository.findVariantForTask(
      taskId,
      variantId,
    );
    if (!existing) {
      throw new NotFoundException('Programming task variant was not found');
    }

    const variant = await this.repository.updateForVerification(variantId, {
      starterCode: dto.starterCode,
      harnessCode: dto.harnessCode,
      referenceSolution: dto.referenceSolution,
      testCases: dto.testCases.map((testCase, index) => this.toCaseInput(testCase, index)),
    });

    await this.enqueueVerification(variantId, variant.updatedAt);

    return this.toVerifyingResponse({
      taskId: existing.task.id,
      taskSlug: existing.task.slug,
      variantId,
    });
  }

  async findForEditing(id: string) {
    const task = await this.repository.findForEditing(id);
    if (!task) {
      throw new NotFoundException('Programming task was not found');
    }

    return task;
  }

  async updateDetails(id: string, dto: UpdateProgrammingTaskDetailsDto) {
    // Лёгкий select вместо findForEditing: тут нужен только slug для ответа,
    // не все варианты и скрытые тесты задачи.
    const task = await this.repository.findById(id);
    if (!task) {
      throw new NotFoundException('Programming task was not found');
    }
    const data = {
      title: dto.title,
      description: dto.description,
      difficulty: dto.difficulty,
    };
    const result = await this.repository.updateDetails(
      id,
      dto.expectedVersion,
      data,
    );
    if (result.count === 0) {
      throw new ConflictException(
        'Programming task was changed by another administrator',
      );
    }

    return {
      id: task.id,
      slug: task.slug,
      ...data,
      version: dto.expectedVersion + 1,
    };
  }

  async delete(id: string): Promise<void> {
    const task = await this.repository.findById(id);
    if (!task) {
      throw new NotFoundException('Programming task was not found');
    }

    await this.repository.delete(id);
  }

  async findAvailable(
    language: EditorLanguage,
  ): Promise<ProgrammingTaskListItemResponse[]> {
    const tasks = await this.repository.findAvailable(language);
    return tasks.map((task) => new ProgrammingTaskListItemResponse(task));
  }

  async getHarnessTemplate(
    language: EditorLanguage,
  ): Promise<{ harnessCode: string }> {
    const template = await this.repository.findActiveHarnessTemplate(language);
    if (!template) {
      throw new NotFoundException(
        'Active programming task Harness template was not found',
      );
    }

    return { harnessCode: template.code };
  }

  async findActiveForSession(id: string, language: EditorLanguage) {
    const task = await this.repository.findActiveForSession(id, language);
    if (!task || !task.variants[0]) {
      throw new NotFoundException(
        'Programming task is unavailable for the selected language',
      );
    }
    return task;
  }

  private async enqueueVerification(
    variantId: string,
    updatedAt: Date,
  ): Promise<void> {
    try {
      await enqueueProgrammingTaskVerification(
        this.verificationQueue,
        variantId,
        updatedAt,
      );
    } catch (error) {
      this.logger.warn(
        `Could not enqueue verification for variant ${variantId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Вариант остаётся VERIFYING: ProgrammingTaskVerificationRecoveryService
      // поставит его в очередь повторно, когда она снова станет доступна.
      // Здесь нельзя трогать его статус - это создало бы конфликт с recovery
      // и могло бы само бросить исключение, скрыв исходную ошибку очереди.
      throw new ServiceUnavailableException(
        'Programming task verification queue is unavailable',
      );
    }
  }

  private toPrismaJson(
    value: unknown,
  ): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
    return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
  }

  // Общий маппинг тест-кейса для create/addVariant/updateAndVerify -
  // раньше был скопирован в каждый из трёх методов отдельно.
  private toCaseInput(testCase: CreateProgrammingTaskCaseDto, position: number) {
    return {
      position,
      name: testCase.name,
      input: this.toPrismaJson(testCase.input),
      expectedOutput: this.toPrismaJson(testCase.expectedOutput),
    };
  }

  // Общая форма ответа create/addVariant/updateAndVerify сразу после
  // постановки проверки в очередь - раньше дублировалась в каждом методе.
  private toVerifyingResponse(params: {
    taskId: string;
    taskSlug: string;
    variantId: string;
  }) {
    return {
      id: params.taskId,
      slug: params.taskSlug,
      variantId: params.variantId,
      status: ProgrammingTaskVariantStatus.VERIFYING,
      verificationError: null,
    };
  }

  // Slug нигде не показывается пользователю - короткий случайный суффикс
  // проще и быстрее, чем перебор "-2", "-3"... через отдельные запросы к базе.
  // Коллизия практически исключена, а если всё же случится - её поймает
  // retry по P2002 в createAndVerify.
  private generateSlugCandidate(title: string): string {
    const base = slugify(title) || 'task';
    return `${base}-${randomBytes(SLUG_SUFFIX_BYTES).toString('hex')}`;
  }

  private isSlugUniqueConflict(error: unknown): boolean {
    return this.isUniqueConstraintConflict(error, 'slug');
  }

  private isUniqueConstraintConflict(error: unknown, field: string): boolean {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2002'
    ) {
      return false;
    }

    const target = error.meta?.target;
    if (target === undefined) {
      return true;
    }
    if (Array.isArray(target)) {
      return target.some(
        (candidate) => typeof candidate === 'string' && candidate.includes(field),
      );
    }
    return typeof target === 'string' && target.includes(field);
  }
}
