import { UserStatus } from '../../src/prisma/generated/enums.ts';

// Общий пароль для всех сид-пользователей — только для локальной разработки.
// seed.ts хеширует его bcrypt-ом ровно так же, как AuthService.register,
// поэтому под этими учётками можно логиниться через POST /auth/login.
export const SEED_USER_PASSWORD = 'Password123!';

// Форма записи повторяет CreateUserDto / RegisterDto: сырой `password`
// (не `passwordHash`), плюс поля профиля из модели User.
export default [
  {
    email: 'owner@interviewly.test',
    password: SEED_USER_PASSWORD,
    firstName: 'Olivia',
    lastName: 'Owner',
    avatarPath: null,
    timeZone: 'Europe/Moscow',
    isAdmin: false,
    registrationCompleted: true,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date('2026-08-01T10:00:00.000Z'),
  },
  {
    email: 'interviewer@interviewly.test',
    password: SEED_USER_PASSWORD,
    firstName: 'Ivan',
    lastName: 'Interviewer',
    avatarPath: null,
    timeZone: 'Europe/Moscow',
    isAdmin: false,
    registrationCompleted: true,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date('2026-08-02T10:00:00.000Z'),
  },
  {
    email: 'candidate@interviewly.test',
    password: SEED_USER_PASSWORD,
    firstName: 'Clara',
    lastName: 'Candidate',
    avatarPath: null,
    timeZone: 'Europe/Berlin',
    isAdmin: false,
    registrationCompleted: true,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date('2026-08-03T10:00:00.000Z'),
  },
  {
    email: 'admin@interviewly.test',
    password: SEED_USER_PASSWORD,
    firstName: 'Alice',
    lastName: 'Admin',
    avatarPath: null,
    timeZone: 'Europe/Moscow',
    isAdmin: true,
    registrationCompleted: true,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date('2026-08-04T10:00:00.000Z'),
  },
  {
    email: 'user@interviewly.test',
    password: SEED_USER_PASSWORD,
    firstName: 'Noah',
    lastName: 'User',
    avatarPath: null,
    timeZone: 'Europe/Berlin',
    isAdmin: false,
    registrationCompleted: true,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date('2026-08-05T10:00:00.000Z'),
  },
];
