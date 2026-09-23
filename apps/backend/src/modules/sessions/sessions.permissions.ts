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
    allowRoles: RoleList;
  };
  createAccessRequest: {
    description: string;
    allowAuthenticated: boolean;
  };
  manageAccessRequests: {
    description: string;
    allowAdmin: boolean;
    allowRoles: RoleList;
  };
  connectToRoom: {
    description: string;
    allowAdmin: boolean;
    allowParticipant: boolean;
  };
  singleActiveRoom: {
    description: string;
    enabled: boolean;
    enforceForRoles: RoleList;
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
      'Видеть участников и их количество: только HOST этой комнаты, её участники или admin',
    allowAdmin: true,
    allowRoles: [
      SessionParticipantRole.HOST,
      SessionParticipantRole.INTERVIEWER,
      SessionParticipantRole.CANDIDATE,
    ],
  },

  createAccessRequest: {
    description:
      'Подать заявку на вход (OPEN/PASSWORD; INVITE — только если уже не в списке запрещён)',
    allowAuthenticated: true,
  },

  manageAccessRequests: {
    description:
      'Смотреть и принимать/отклонять заявки — только HOST комнаты (или admin)',
    allowAdmin: true,
    allowRoles: [SessionParticipantRole.HOST],
  },

  connectToRoom: {
    description:
      'Войти в комнату / получить LiveKit token — только участник сессии',
    allowAdmin: false,
    allowParticipant: true,
  },

  singleActiveRoom: {
    description:
      'Одна активная комната для INTERVIEWER/CANDIDATE; HOST может быть в нескольких',
    enabled: true,
    enforceForRoles: [
      SessionParticipantRole.INTERVIEWER,
      SessionParticipantRole.CANDIDATE,
    ],
  },
} as const satisfies SessionPermissionsConfig;

export type SessionPermissionKey = keyof typeof SESSION_PERMISSIONS;

export function roleAllowed(
  roles: RoleList,
  role: SessionParticipantRole,
): boolean {
  return roles.includes(role);
}
