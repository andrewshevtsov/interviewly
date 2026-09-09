export default [
  // Scheduled business: owner + interviewer
  {
    sessionId: '00000000-0000-4000-8000-000000000101',
    userEmail: 'owner@interviewly.test',
    joinedAt: null,
    leftAt: null,
    reconnectCount: 0,
    offlineSeconds: 0,
  },
  {
    sessionId: '00000000-0000-4000-8000-000000000101',
    userEmail: 'interviewer@interviewly.test',
    joinedAt: null,
    leftAt: null,
    reconnectCount: 0,
    offlineSeconds: 0,
  },

  // Active mock: interviewer + candidate
  {
    sessionId: '00000000-0000-4000-8000-000000000102',
    userEmail: 'interviewer@interviewly.test',
    joinedAt: new Date('2026-08-30T15:05:00.000Z'),
    leftAt: null,
    reconnectCount: 0,
    offlineSeconds: 0,
  },
  {
    sessionId: '00000000-0000-4000-8000-000000000102',
    userEmail: 'candidate@interviewly.test',
    joinedAt: new Date('2026-08-30T15:07:00.000Z'),
    leftAt: null,
    reconnectCount: 1,
    offlineSeconds: 20,
  },

  // Completed mock: owner + candidate
  {
    sessionId: '00000000-0000-4000-8000-000000000103',
    userEmail: 'owner@interviewly.test',
    joinedAt: new Date('2026-08-20T12:05:00.000Z'),
    leftAt: new Date('2026-08-20T13:00:00.000Z'),
    reconnectCount: 0,
    offlineSeconds: 0,
  },
  {
    sessionId: '00000000-0000-4000-8000-000000000103',
    userEmail: 'candidate@interviewly.test',
    joinedAt: new Date('2026-08-20T12:06:00.000Z'),
    leftAt: new Date('2026-08-20T12:58:00.000Z'),
    reconnectCount: 2,
    offlineSeconds: 45,
  },
];
