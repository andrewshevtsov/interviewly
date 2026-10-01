import { SessionParticipantRole } from '../../src/prisma/generated/enums';

export default [
  // Запланированная бизнес-сессия: owner + interviewer
  {
    sessionId: '00000000-0000-4000-8000-000000000101',
    userEmail: 'owner@interviewly.test',
    role: SessionParticipantRole.INTERVIEWER,
    joinedAt: null,
    leftAt: null,
    reconnectCount: 0,
    offlineSeconds: 0,
  },
  {
    sessionId: '00000000-0000-4000-8000-000000000101',
    userEmail: 'interviewer@interviewly.test',
    role: SessionParticipantRole.INTERVIEWER,
    joinedAt: null,
    leftAt: null,
    reconnectCount: 0,
    offlineSeconds: 0,
  },

  // Активная мок-сессия: interviewer + candidate
  {
    sessionId: '00000000-0000-4000-8000-000000000102',
    userEmail: 'interviewer@interviewly.test',
    role: SessionParticipantRole.INTERVIEWER,
    joinedAt: new Date('2026-08-30T15:05:00.000Z'),
    leftAt: null,
    reconnectCount: 0,
    offlineSeconds: 0,
  },
  {
    sessionId: '00000000-0000-4000-8000-000000000102',
    userEmail: 'candidate@interviewly.test',
    role: SessionParticipantRole.CANDIDATE,
    joinedAt: new Date('2026-08-30T15:07:00.000Z'),
    leftAt: null,
    reconnectCount: 1,
    offlineSeconds: 20,
  },

  // Завершённая мок-сессия: owner + candidate
  {
    sessionId: '00000000-0000-4000-8000-000000000103',
    userEmail: 'owner@interviewly.test',
    role: SessionParticipantRole.INTERVIEWER,
    joinedAt: new Date('2026-08-20T12:05:00.000Z'),
    leftAt: new Date('2026-08-20T13:00:00.000Z'),
    reconnectCount: 0,
    offlineSeconds: 0,
  },
  {
    sessionId: '00000000-0000-4000-8000-000000000103',
    userEmail: 'candidate@interviewly.test',
    role: SessionParticipantRole.CANDIDATE,
    joinedAt: new Date('2026-08-20T12:06:00.000Z'),
    leftAt: new Date('2026-08-20T12:58:00.000Z'),
    reconnectCount: 2,
    offlineSeconds: 45,
  },

  // Завершённая мок-сессия: owner + user
  {
    sessionId: '00000000-0000-4000-8000-000000000104',
    userEmail: 'owner@interviewly.test',
    joinedAt: new Date('2026-08-25T14:05:00.000Z'),
    leftAt: new Date('2026-08-25T14:46:00.000Z'),
    reconnectCount: 0,
    offlineSeconds: 0,
  },
  {
    sessionId: '00000000-0000-4000-8000-000000000104',
    userEmail: 'user@interviewly.test',
    joinedAt: new Date('2026-08-25T14:06:00.000Z'),
    leftAt: new Date('2026-08-25T14:45:00.000Z'),
    reconnectCount: 1,
    offlineSeconds: 30,
  },

  // Завершённая мок-сессия: interviewer + candidate
  {
    sessionId: '00000000-0000-4000-8000-000000000105',
    userEmail: 'interviewer@interviewly.test',
    joinedAt: new Date('2026-08-28T16:05:00.000Z'),
    leftAt: new Date('2026-08-28T16:52:00.000Z'),
    reconnectCount: 0,
    offlineSeconds: 0,
  },
  {
    sessionId: '00000000-0000-4000-8000-000000000105',
    userEmail: 'candidate@interviewly.test',
    joinedAt: new Date('2026-08-28T16:06:00.000Z'),
    leftAt: new Date('2026-08-28T16:51:00.000Z'),
    reconnectCount: 1,
    offlineSeconds: 15,
  },
];
