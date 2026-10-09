import { ProfessionLevel } from '../../../prisma/generated/enums.ts';

/**
 * Карточка участника на витрине. Контакты (email, telegram) и оценки из отзывов
 * не отдаются: отзывы приватны, контакты нужны только для уведомлений о мэтче.
 */
export class ShowcaseCardResponse {
  /** Идентификатор карточки (профиля): по нему уходит отклик */
  id!: string;
  name!: string;
  role!: string;
  level!: ProfessionLevel;
  stack!: string[];
  bio!: string | null;
  /** Завершённые интервью, в которых участник был - считаются так же, как в лидерборде */
  interviewsCount!: number;
  /** Участник сейчас в активной сессии */
  inSession!: boolean;

  constructor(partial: ShowcaseCardResponse) {
    Object.assign(this, partial);
  }
}

export class ShowcasePageResponse {
  items!: ShowcaseCardResponse[];
  /** Курсор следующей страницы; `null`, если страниц больше нет */
  nextCursor!: string | null;

  constructor(partial: ShowcasePageResponse) {
    Object.assign(this, partial);
  }
}
