import { ProfessionLevel } from '../../../prisma/generated/enums.ts';

/**
 * Отклик, из-за которого на карточку пока нельзя откликнуться: ждёт ответа (`PENDING`)
 * отклонён и действует пауза (`REJECTED`, `canRetryAt` - когда пауза кончится) или принят и встреча
 * ещё действует (`ACCEPTED`).
 */
export class ShowcaseMyResponse {
  status!: 'PENDING' | 'REJECTED' | 'ACCEPTED';
  canRetryAt!: Date | null;
}

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
  /** Блокирует повторный отклик */
  myResponse!: ShowcaseMyResponse | null;

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
