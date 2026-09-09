import {
  SessionAccess,
  SessionStatus,
  SessionType,
} from '../../src/prisma/generated/enums.ts';

export default [
  {
    id: '00000000-0000-4000-8000-000000000101',
    ownerEmail: 'owner@interviewly.test',
    type: SessionType.BUSINESS,
    access: SessionAccess.INVITE,
    status: SessionStatus.SCHEDULED,
    passwordHash: null,
    scheduledAt: new Date('2026-09-10T15:00:00.000Z'),
    startedAt: null,
    endedAt: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    ownerEmail: 'interviewer@interviewly.test',
    type: SessionType.MOCK,
    access: SessionAccess.OPEN,
    status: SessionStatus.ACTIVE,
    passwordHash: null,
    scheduledAt: new Date('2026-08-30T15:00:00.000Z'),
    startedAt: new Date('2026-08-30T15:05:00.000Z'),
    endedAt: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000103',
    ownerEmail: 'owner@interviewly.test',
    type: SessionType.MOCK,
    access: SessionAccess.PASSWORD,
    status: SessionStatus.COMPLETED,
    passwordHash: 'seed-only-not-a-real-password-hash',
    scheduledAt: new Date('2026-08-20T12:00:00.000Z'),
    startedAt: new Date('2026-08-20T12:05:00.000Z'),
    endedAt: new Date('2026-08-20T13:00:00.000Z'),
  },
];
