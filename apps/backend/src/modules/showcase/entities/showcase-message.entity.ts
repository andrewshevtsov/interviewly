/** Сообщение в чате по отклику */
export class ShowcaseMessageResponse {
  id!: string;
  text!: string;
  createdAt!: Date;
  mine!: boolean;

  constructor(partial: ShowcaseMessageResponse) {
    Object.assign(this, partial);
  }
}

/** Непрочитанные сообщения собеседника по одному отклику */
export class ShowcaseUnreadMessages {
  responseId!: string;
  count!: number;
  box!: 'incoming' | 'outgoing';

  constructor(partial: ShowcaseUnreadMessages) {
    Object.assign(this, partial);
  }
}
