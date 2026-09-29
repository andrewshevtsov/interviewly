import type { DemoTaskLanguage } from '../demo-tasks.ts';

export class DemoTaskResponse {
  index!: number;
  total!: number;
  language!: DemoTaskLanguage;
  task!: string;
  code!: string;

  constructor(partial: DemoTaskResponse) {
    Object.assign(this, partial);
  }
}

/** Включён ли демо-режим и какая задача сейчас показана в комнате. */
export class DemoTaskStateResponse {
  enabled!: boolean;
  current!: DemoTaskResponse | null;

  constructor(partial: DemoTaskStateResponse) {
    Object.assign(this, partial);
  }
}
