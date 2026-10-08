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
  endSession: {
    description: string;
    allowAdmin: boolean;
    allowOwner: boolean;
  };
  cancelSession: {
    description: string;
    allowAdmin: boolean;
    allowOwner: boolean;
    allowParticipant: boolean;
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
  requestAiHint: {
    description: string;
    allowRoles: RoleList;
  };
  switchDemoTask: {
    description: string;
    allowRoles: RoleList;
  };
  toggleEditor: {
    description: string;
    allowRoles: RoleList;
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
      'Видеть участников и их количество, AI-подсказки и события комнаты по WebSocket: только владелец комнаты, её участники или admin',
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

  endSession: {
    description:
      'Завершить интервью для всех (COMPLETED + закрытие LiveKit-комнаты) - владелец или admin',
    allowAdmin: true,
    allowOwner: true,
  },

  cancelSession: {
    description:
      'Отменить интервью до его начала (CANCELLED) - владелец, любой участник или admin',
    allowAdmin: true,
    allowOwner: true,
    allowParticipant: true,
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

  requestAiHint: {
    description:
      'Запросить AI-подсказку во время ACTIVE-интервью (лимит на сессию)',
    allowRoles: [SessionParticipantRole.CANDIDATE],
  },

  switchDemoTask: {
    description:
      'Временно (AI_HINTS_DEMO_CONTEXT): показать в комнате следующую демо-задачу - только интервьюер',
    allowRoles: [SessionParticipantRole.INTERVIEWER],
  },

  toggleEditor: {
    description:
      'Открыть/закрыть редактор кода в комнате (знакомство <-> лайв-кодинг)',
    allowRoles: [SessionParticipantRole.INTERVIEWER],
  },
} as const satisfies SessionPermissionsConfig;

export type SessionPermissionKey = keyof typeof SESSION_PERMISSIONS;
