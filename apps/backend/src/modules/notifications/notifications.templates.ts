import { SessionParticipantRole } from '../../prisma/generated/enums.ts';

export interface NotificationMessage {
  subject: string;
  text: string;
}

const DEFAULT_TIME_ZONE = 'UTC';

/** Дата и время в часовом поясе получателя; без настроенного пояса - UTC с пометкой */
export function formatDateTime(date: Date, timeZone: string | null): string {
  const format = (zone: string) =>
    new Intl.DateTimeFormat('ru-RU', {
      timeZone: zone,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);

  try {
    return format(timeZone ?? DEFAULT_TIME_ZONE);
  } catch {
    return format(DEFAULT_TIME_ZONE);
  }
}

const roleLabel = (role: SessionParticipantRole) =>
  role === SessionParticipantRole.INTERVIEWER ? 'интервьюер' : 'кандидат';

export function responseCreatedMessage(params: {
  responderName: string;
  responderRole: SessionParticipantRole;
  scheduledAt: Date;
  timeZone: string | null;
}): NotificationMessage {
  const ownerRole =
    params.responderRole === SessionParticipantRole.INTERVIEWER
      ? SessionParticipantRole.CANDIDATE
      : SessionParticipantRole.INTERVIEWER;

  return {
    subject: 'Новый отклик на вашу карточку',
    text: [
      `${params.responderName} откликнулся(ась) на вашу карточку на витрине.`,
      `Предлагает встречу ${formatDateTime(params.scheduledAt, params.timeZone)}: он(а) будет ${roleLabel(params.responderRole)}, вы - ${roleLabel(ownerRole)}.`,
      'Откройте входящие отклики, чтобы принять или отклонить его.',
    ].join('\n'),
  };
}

export function responseAcceptedMessage(params: {
  ownerName: string;
  responderRole: SessionParticipantRole;
  scheduledAt: Date;
  timeZone: string | null;
}): NotificationMessage {
  return {
    subject: 'Ваш отклик принят',
    text: [
      `${params.ownerName} принял(а) ваш отклик. Встреча назначена на ${formatDateTime(params.scheduledAt, params.timeZone)}.`,
      `Ваша роль: ${roleLabel(params.responderRole)}.`,
      'За 2 часа до начала бот пришлёт ссылку на видеокомнату.',
    ].join('\n'),
  };
}

export function responseRejectedMessage(params: {
  ownerName: string;
  scheduledAt: Date;
  timeZone: string | null;
  reason: string;
  timeMismatch: boolean;
  retryAt: Date | null;
}): NotificationMessage {
  const followUp = params.timeMismatch
    ? 'Отказ связан с временем: можно сразу предложить другое время.'
    : params.retryAt
      ? `Откликнуться на эту карточку снова можно после ${formatDateTime(params.retryAt, params.timeZone)}.`
      : '';

  return {
    subject: 'Ваш отклик отклонён',
    text: [
      `${params.ownerName} не сможет провести встречу ${formatDateTime(params.scheduledAt, params.timeZone)}.`,
      `Причина: ${params.reason}`,
      followUp,
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

export function sessionCancelledMessage(params: {
  cancellerName: string;
  scheduledAt: Date | null;
  timeZone: string | null;
  reason: string | null;
}): NotificationMessage {
  const when = params.scheduledAt ? ` ${formatDateTime(params.scheduledAt, params.timeZone)}` : '';

  return {
    subject: 'Встреча отменена',
    text: [`${params.cancellerName} отменил(а) встречу${when}.`, params.reason ? `Причина: ${params.reason}` : '']
      .filter(Boolean)
      .join('\n'),
  };
}

export function sessionReminderMessage(params: {
  partnerName: string;
  role: SessionParticipantRole;
  scheduledAt: Date;
  timeZone: string | null;
  roomUrl: string;
}): NotificationMessage {
  return {
    subject: 'Скоро интервью',
    text: [
      `Начало: ${formatDateTime(params.scheduledAt, params.timeZone)}.`,
      `Партнёр: ${params.partnerName}. Ваша роль: ${roleLabel(params.role)}.`,
      `Ссылка на видеокомнату: ${params.roomUrl}`,
    ].join('\n'),
  };
}
