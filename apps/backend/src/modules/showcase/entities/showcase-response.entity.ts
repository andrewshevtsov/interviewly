import {
  ProfessionLevel,
  SessionParticipantRole,
  ShowcaseResponseStatus,
} from '../../../prisma/generated/enums.ts';

/** Результат действия с откликом: создание, принятие, отказ, отзыв */
export class ShowcaseResponseResult {
  id!: string;
  status!: ShowcaseResponseStatus;
  /** Роль, в которой откликнувшийся хочет прийти */
  role!: SessionParticipantRole;
  /** Предложенное начало встречи */
  scheduledAt!: Date;
  /** Когда бот пришлёт обоим ссылку на комнату (за 2 часа до встречи) - для сообщения в интерфейсе */
  reminderAt!: Date;
  /** Сессия, созданная при принятии */
  sessionId!: string | null;
  createdAt!: Date;
  reviewedAt!: Date | null;
  rejectionReason!: string | null;
  timeMismatch!: boolean;

  constructor(partial: ShowcaseResponseResult) {
    Object.assign(this, partial);
  }
}

/** Кто откликнулся: без контактов, только то, что нужно для решения */
export class ShowcaseResponderSummary {
  name!: string;
  /** Должность из профиля */
  title!: string | null;
  level!: ProfessionLevel | null;
  stack!: string[];
  bio!: string | null;
}

/** Отклик на карточку текущего пользователя (вид владельца) */
export class ShowcaseIncomingResponse {
  id!: string;
  status!: ShowcaseResponseStatus;
  /** Роль, в которой хочет прийти откликнувшийся */
  role!: SessionParticipantRole;
  /** Роль, в которой на встрече окажется владелец карточки */
  ownerRole!: SessionParticipantRole;
  scheduledAt!: Date;
  responder!: ShowcaseResponderSummary;
  sessionId!: string | null;
  createdAt!: Date;
  reviewedAt!: Date | null;
  rejectionReason!: string | null;
  timeMismatch!: boolean;

  constructor(partial: ShowcaseIncomingResponse) {
    Object.assign(this, partial);
  }
}

export class ShowcaseOutgoingCardSummary {
  id!: string;
  name!: string;
  title!: string;
}

/** Отклик текущего пользователя на карточку другого участника */
export class ShowcaseOutgoingResponse {
  id!: string;
  status!: ShowcaseResponseStatus;
  role!: SessionParticipantRole;
  scheduledAt!: Date;
  card!: ShowcaseOutgoingCardSummary;
  sessionId!: string | null;
  createdAt!: Date;
  reviewedAt!: Date | null;
  /** Причина отказа от владельца карточки */
  rejectionReason!: string | null;
  timeMismatch!: boolean;
  /** После отказа не из-за времени: когда можно откликнуться на эту карточку снова */
  canRetryAt!: Date | null;

  constructor(partial: ShowcaseOutgoingResponse) {
    Object.assign(this, partial);
  }
}
