import { describe, expect, it } from 'vitest';
import {
  formatDateTime,
  responseAcceptedMessage,
  responseCreatedMessage,
  responseRejectedMessage,
  sessionCancelledMessage,
  sessionReminderMessage,
} from './notifications.templates.ts';

const AT = new Date('2026-10-12T11:00:00.000Z');

describe('formatDateTime', () => {
  it('показывает время в часовом поясе получателя', () => {
    expect(formatDateTime(AT, 'Asia/Dubai')).toContain('15:00');
    expect(formatDateTime(AT, 'Europe/Berlin')).toContain('13:00');
  });

  it('без настроенного пояса или с неизвестным поясом использует UTC и не падает', () => {
    expect(formatDateTime(AT, null)).toContain('11:00');
    expect(formatDateTime(AT, 'Mars/Olympus')).toContain('11:00');
  });
});

describe('шаблоны сообщений', () => {
  it('новый отклик: кто, во сколько в часовом поясе владельца и роли обоих', () => {
    const { subject, text } = responseCreatedMessage({
      responderName: 'Clara Candidate',
      responderRole: 'CANDIDATE',
      scheduledAt: AT,
      timeZone: 'Asia/Dubai',
    });

    expect(subject).toBe('Новый отклик на вашу карточку');
    expect(text).toContain('Clara Candidate');
    expect(text).toContain('15:00');
    expect(text).toContain('он(а) будет кандидат, вы - интервьюер');
  });

  it('новый отклик: роли меняются местами, если откликнувшийся интервьюер', () => {
    const { text } = responseCreatedMessage({
      responderName: 'Ivan',
      responderRole: 'INTERVIEWER',
      scheduledAt: AT,
      timeZone: null,
    });

    expect(text).toContain('он(а) будет интервьюер, вы - кандидат');
  });

  it('принятие: кто принял, время, роль и инфа о ссылке за 2 часа', () => {
    const { subject, text } = responseAcceptedMessage({
      ownerName: 'Ivan Petrov',
      responderRole: 'CANDIDATE',
      scheduledAt: AT,
      timeZone: 'Asia/Dubai',
    });

    expect(subject).toBe('Ваш отклик принят');
    expect(text).toContain('Ivan Petrov');
    expect(text).toContain('15:00');
    expect(text).toContain('кандидат');
    expect(text).toContain('За 2 часа');
  });

  it('отказ: причина и время повтора', () => {
    const { text } = responseRejectedMessage({
      ownerName: 'Ivan',
      scheduledAt: AT,
      timeZone: null,
      reason: 'Нет времени на этой неделе',
      timeMismatch: false,
      retryAt: new Date('2026-10-14T11:00:00.000Z'),
    });

    expect(text).toContain('Причина: Нет времени на этой неделе');
    expect(text).toContain('снова можно после');
  });

  it('отказ из-за времени предлагает сразу выбрать другое время', () => {
    const { text } = responseRejectedMessage({
      ownerName: 'Ivan',
      scheduledAt: AT,
      timeZone: null,
      reason: 'Занят',
      timeMismatch: true,
      retryAt: null,
    });

    expect(text).toContain('сразу предложить другое время');
    expect(text).not.toContain('снова можно после');
  });

  it('отмена встречи: кто отменил и причина, если она есть', () => {
    const withReason = sessionCancelledMessage({
      cancellerName: 'Clara',
      scheduledAt: AT,
      timeZone: null,
      reason: 'Заболела',
    });
    const withoutReason = sessionCancelledMessage({
      cancellerName: 'Clara',
      scheduledAt: null,
      timeZone: null,
      reason: null,
    });

    expect(withReason.text).toContain('Clara отменил(а) встречу');
    expect(withReason.text).toContain('Причина: Заболела');
    expect(withoutReason.text).not.toContain('Причина');
  });

  it('напоминание: ссылка, партнёр и роль', () => {
    const { text } = sessionReminderMessage({
      partnerName: 'Ivan Petrov',
      role: 'INTERVIEWER',
      scheduledAt: AT,
      timeZone: 'Asia/Dubai',
      roomUrl: 'http://localhost:3000/sessions/abc',
    });

    expect(text).toContain('http://localhost:3000/sessions/abc');
    expect(text).toContain('Ivan Petrov');
    expect(text).toContain('интервьюер');
    expect(text).toContain('15:00');
  });
});
