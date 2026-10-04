// Взаимные отзывы участников завершённых сессий - для страниц отзывов и истории
export default [
  // Сессия 103: owner + candidate
  {
    sessionId: '00000000-0000-4000-8000-000000000103',
    authorEmail: 'owner@interviewly.test',
    targetEmail: 'candidate@interviewly.test',
    score: 8,
    comment: 'Уверенно решил задачу, стоит подтянуть оценку сложности.',
  },
  {
    sessionId: '00000000-0000-4000-8000-000000000103',
    authorEmail: 'candidate@interviewly.test',
    targetEmail: 'owner@interviewly.test',
    score: 9,
    comment: null,
  },

  // Сессия 104: owner + user
  {
    sessionId: '00000000-0000-4000-8000-000000000104',
    authorEmail: 'owner@interviewly.test',
    targetEmail: 'user@interviewly.test',
    score: 7,
    comment: 'Хорошая теория, на лайв-кодинге не хватило времени.',
  },
  {
    sessionId: '00000000-0000-4000-8000-000000000104',
    authorEmail: 'user@interviewly.test',
    targetEmail: 'owner@interviewly.test',
    score: 10,
    comment: null,
  },

  // Сессия 105: interviewer + candidate
  {
    sessionId: '00000000-0000-4000-8000-000000000105',
    authorEmail: 'interviewer@interviewly.test',
    targetEmail: 'candidate@interviewly.test',
    score: 9,
    comment: null,
  },
  {
    sessionId: '00000000-0000-4000-8000-000000000105',
    authorEmail: 'candidate@interviewly.test',
    targetEmail: 'interviewer@interviewly.test',
    score: 8,
    comment: null,
  },
];
