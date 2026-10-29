import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import {
  EditorLanguage,
  ProgrammingTaskVariantStatus,
} from '../../prisma/generated/enums.ts';
import { Prisma } from '../../prisma/generated/client.ts';
import { PROGRAMMING_TASK_VERIFICATIONS_QUEUE } from './programming-task-verification.constants.ts';
import { enqueueProgrammingTaskVerification } from './programming-task-verification.queue.ts';
import type { ProgrammingTaskVerificationJob } from './programming-task-verification.types.ts';
import type { CreateProgrammingTaskDto } from './dto/create-programming-task.dto.ts';
import type { UpdateProgrammingTaskDetailsDto } from './dto/update-programming-task-details.dto.ts';
import type { UpsertProgrammingTaskVariantDto } from './dto/upsert-programming-task-variant.dto.ts';
import { ProgrammingTaskListItemResponse } from './entities/programming-task.entity.ts';
import { ProgrammingTasksRepository } from './programming-tasks.repository.ts';

const MAX_SLUG_CREATION_ATTEMPTS = 10;

@Injectable()
export class ProgrammingTasksService {
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
      const slug = await this.findAvailableSlugCandidate(dto.title);
      try {
        task = await this.repository.createWithVariant({
          slug,
          title: dto.title.trim(),
          description: dto.description.trim(),
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
                create: dto.testCases.map((testCase, index) => ({
                  position: index,
                  name: testCase.name.trim(),
                  input: this.toPrismaJson(testCase.input),
                  expectedOutput: this.toPrismaJson(testCase.expectedOutput),
                })),
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

    await this.enqueueVerification(variant.id, variant.updatedAt);

    return {
      id: task.id,
      slug: task.slug,
      variantId: variant.id,
      status: ProgrammingTaskVariantStatus.VERIFYING,
      verificationError: null,
    };
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

    const variant = await this.repository.createVariantForTask({
      task: { connect: { id: taskId } },
      language: dto.language,
      starterCode: dto.starterCode,
      harnessCode: dto.harnessCode,
      referenceSolution: dto.referenceSolution,
      status: ProgrammingTaskVariantStatus.VERIFYING,
      createdBy: { connect: { id: authorId } },
      testCases: {
        create: dto.testCases.map((testCase, index) => ({
          position: index,
          name: testCase.name.trim(),
          input: this.toPrismaJson(testCase.input),
          expectedOutput: this.toPrismaJson(testCase.expectedOutput),
        })),
      },
    });

    await this.enqueueVerification(variant.id, variant.updatedAt);

    return {
      id: task.id,
      slug: task.slug,
      variantId: variant.id,
      status: ProgrammingTaskVariantStatus.VERIFYING,
      verificationError: null,
    };
  }

  async updateAndVerify(
    taskId: string,
    variantId: string,
    dto: UpsertProgrammingTaskVariantDto,
  ) {
    const existing = await this.repository.findVariantForTask(
      taskId,
      variantId,
    );
    if (!existing) {
      throw new NotFoundException('Programming task variant was not found');
    }

    const variant = await this.repository.updateForVerification(variantId, {
      language: dto.language,
      starterCode: dto.starterCode,
      harnessCode: dto.harnessCode,
      referenceSolution: dto.referenceSolution,
      testCases: dto.testCases.map((testCase, index) => ({
        position: index,
        name: testCase.name.trim(),
        input: this.toPrismaJson(testCase.input),
        expectedOutput: this.toPrismaJson(testCase.expectedOutput),
      })),
    });

    await this.enqueueVerification(variantId, variant.updatedAt);

    return {
      id: existing.task.id,
      slug: existing.task.slug,
      variantId,
      status: ProgrammingTaskVariantStatus.VERIFYING,
      verificationError: null,
    };
  }

  async findForEditing(id: string) {
    const task = await this.repository.findForEditing(id);
    if (!task) {
      throw new NotFoundException('Programming task was not found');
    }

    return task;
  }

  async updateDetails(id: string, dto: UpdateProgrammingTaskDetailsDto) {
    const task = await this.findForEditing(id);
    const expectedUpdatedAt = new Date(dto.expectedUpdatedAt);
    const nextUpdatedAt = new Date(
      Math.max(Date.now(), expectedUpdatedAt.getTime() + 1),
    );
    const data = {
      title: dto.title.trim(),
      description: dto.description.trim(),
      difficulty: dto.difficulty,
    };
    const result = await this.repository.updateDetails(
      id,
      expectedUpdatedAt,
      nextUpdatedAt,
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
      updatedAt: nextUpdatedAt,
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
    } catch {
      await this.repository.completeVariantVerification(variantId, updatedAt, {
        status: ProgrammingTaskVariantStatus.FAILED,
        verifiedAt: null,
        lastVerificationError: 'Verification queue is unavailable',
      });
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

  private async findAvailableSlugCandidate(title: string): Promise<string> {
    const base = this.slugify(title) || 'task';
    let slug = base;
    let suffix = 2;
    while (await this.repository.findBySlug(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }

  private isSlugUniqueConflict(error: unknown): boolean {
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
        (field) => typeof field === 'string' && field.includes('slug'),
      );
    }
    return typeof target === 'string' && target.includes('slug');
  }

  private slugify(value: string): string {
    const cyrillic = 'абвгдеёзийклмнопрстуфхцчшщъыьэюя';
    const latin = [
      'a',
      'b',
      'v',
      'g',
      'd',
      'e',
      'yo',
      'z',
      'i',
      'y',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'r',
      's',
      't',
      'u',
      'f',
      'h',
      'ts',
      'ch',
      'sh',
      'sch',
      '',
      'y',
      '',
      'e',
      'yu',
      'ya',
    ];
    const transliterated = [...value.toLowerCase()]
      .map((character) => {
        const index = cyrillic.indexOf(character);
        return index >= 0 ? latin[index] : character;
      })
      .join('');

    return transliterated
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
  }
}
