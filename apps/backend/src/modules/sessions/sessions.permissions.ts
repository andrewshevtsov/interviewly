import { SessionParticipantRole } from '../../prisma/generated/enums.ts';

type RoleList = readonly SessionParticipantRole[];

type SessionPermissionsConfig = {
  listAllSessions: {
    description: string;
    allowAdmin: boolean;
    allowRoles: RoleList;
  };
  viewSession: {
    description: string;
    allowAdmin: boolean;
    allowOwner: boolean;
    allowParticipant: boolean;
    allowAccessRequester: boolean;
  };
  viewParticipants: {
    description: string;
    allowAdmin: boolean;
    allowOwner: boolean;
    allowParticipant: boolean;
  };
  createAccessRequest: {
    description: string;
    allowAuthenticated: boolean;
  };
  manageAccessRequests: {
    description: string;
    allowAdmin: boolean;
    allowOwner: boolean;
  };
  transferOwnership: {
    description: string;
    allowAdmin: boolean;
    allowOwner: boolean;
    allowTargetRoles: RoleList;
  };
  connectToRoom: {
    description: string;
    allowAdmin: boolean;
    allowParticipant: boolean;
  };
  singleActiveRoom: {
    description: string;
    enabled: boolean;
    exemptOwner: boolean;
  };
};

/**
 * Матрица прав сессий. Меняйте здесь — сервисы читают этот конфиг.
 */
export const SESSION_PERMISSIONS = {
  listAllSessions: {
    description: 'Видеть все сессии в системе',
    allowAdmin: true,
    allowRoles: [],
  },

  viewSession: {
    description:
      'Видеть карточку сессии (без участников): владелец, участник, автор заявки, admin',
    allowAdmin: true,
    allowOwner: true,
    allowParticipant: true,
    allowAccessRequester: true,
  },

  viewParticipants: {
    description:
      'Видеть участников и их количество: только владелец комнаты, её участники или admin',
    allowAdmin: true,
    allowOwner: true,
    allowParticipant: true,
  },

  createAccessRequest: {
    description:
      'Подать заявку на вход (OPEN/PASSWORD; INVITE — только если уже не в списке запрещён)',
    allowAuthenticated: true,
  },

  manageAccessRequests: {
    description:
      'Смотреть и принимать/отклонять заявки - только владелец комнаты (или admin)',
    allowAdmin: true,
    allowOwner: true,
  },

  transferOwnership: {
    description:
      'Передача владения комнатой только другому интервьюеру;',
    allowAdmin: true,
    allowOwner: true,
    allowTargetRoles: [SessionParticipantRole.INTERVIEWER],
  },

  connectToRoom: {
    description:
      'Войти в комнату / получить LiveKit token — только участник сессии',
    allowAdmin: false,
    allowParticipant: true,
  },

  singleActiveRoom: {
    description:
      'Одна активная комната для участника; свои комнаты владелец держит сколько угодно',
    enabled: true,
    exemptOwner: true,
  },
} as const satisfies SessionPermissionsConfig;

export type SessionPermissionKey = keyof typeof SESSION_PERMISSIONS;
