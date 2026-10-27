import {
  EditorLanguage,
  ProgrammingTaskDifficulty,
} from '../../src/prisma/generated/enums';

// Harness хранится рядом со стартовым кодом, потому что контракт вызова зависит
// от языка. При исполнении coderunner добавит его после кода кандидата и передаст
// конкретный test case в stdin как JSON.
const javascriptSolveHarness = `(() => {
  const __interviewlyFs = require('fs');
  const __interviewlyInput = JSON.parse(__interviewlyFs.readFileSync(0, 'utf8'));
  const __interviewlyResult = solve(__interviewlyInput);
  process.stdout.write(JSON.stringify(__interviewlyResult));
})();`;

const typescriptSolveHarness = `declare const require: (name: string) => {
  readFileSync(fd: number, encoding: string): string;
};
declare const process: { stdout: { write(value: string): void } };

(() => {
  const __interviewlyFs = require('fs');
  const __interviewlyInput = JSON.parse(__interviewlyFs.readFileSync(0, 'utf8')) as unknown;
  const __interviewlyResult = solve(__interviewlyInput as never);
  process.stdout.write(JSON.stringify(__interviewlyResult));
})();`;

const pythonSolveHarness = `def __interviewly_run():
    import json as __interviewly_json
    import sys as __interviewly_sys

    __interviewly_input = __interviewly_json.load(__interviewly_sys.stdin)
    __interviewly_result = solve(__interviewly_input)
    __interviewly_sys.stdout.write(
        __interviewly_json.dumps(__interviewly_result, ensure_ascii=False)
    )


__interviewly_run()`;

const javascriptDequeHarness = `(() => {
  const __interviewlyFs = require('fs');
  const __interviewlyInput = JSON.parse(__interviewlyFs.readFileSync(0, 'utf8'));
  const __interviewlyDeque = new Deque();
  const __interviewlyResult = [];

  for (const [operation, value] of __interviewlyInput.operations) {
    switch (operation) {
      case 'pushFront': __interviewlyDeque.pushFront(value); break;
      case 'pushBack': __interviewlyDeque.pushBack(value); break;
      case 'popFront': __interviewlyResult.push(__interviewlyDeque.popFront()); break;
      case 'popBack': __interviewlyResult.push(__interviewlyDeque.popBack()); break;
      case 'peekFront': __interviewlyResult.push(__interviewlyDeque.peekFront()); break;
      case 'peekBack': __interviewlyResult.push(__interviewlyDeque.peekBack()); break;
      case 'size': __interviewlyResult.push(__interviewlyDeque.size()); break;
      case 'isEmpty': __interviewlyResult.push(__interviewlyDeque.isEmpty()); break;
      default: throw new Error('Неизвестная операция: ' + operation);
    }
  }

  process.stdout.write(JSON.stringify(__interviewlyResult));
})();`;

const typescriptDequeHarness = `declare const require: (name: string) => {
  readFileSync(fd: number, encoding: string): string;
};
declare const process: { stdout: { write(value: string): void } };

(() => {
  const __interviewlyFs = require('fs');
  const __interviewlyInput = JSON.parse(__interviewlyFs.readFileSync(0, 'utf8')) as {
    operations: Array<[string, number?]>;
  };
  const __interviewlyDeque = new Deque<number>();
  const __interviewlyResult: unknown[] = [];

  for (const [operation, value] of __interviewlyInput.operations) {
    switch (operation) {
      case 'pushFront': __interviewlyDeque.pushFront(value as number); break;
      case 'pushBack': __interviewlyDeque.pushBack(value as number); break;
      case 'popFront': __interviewlyResult.push(__interviewlyDeque.popFront()); break;
      case 'popBack': __interviewlyResult.push(__interviewlyDeque.popBack()); break;
      case 'peekFront': __interviewlyResult.push(__interviewlyDeque.peekFront()); break;
      case 'peekBack': __interviewlyResult.push(__interviewlyDeque.peekBack()); break;
      case 'size': __interviewlyResult.push(__interviewlyDeque.size()); break;
      case 'isEmpty': __interviewlyResult.push(__interviewlyDeque.isEmpty()); break;
      default: throw new Error('Неизвестная операция: ' + operation);
    }
  }

  process.stdout.write(JSON.stringify(__interviewlyResult));
})();`;

const pythonDequeHarness = `def __interviewly_run():
    import json as __interviewly_json
    import sys as __interviewly_sys

    __interviewly_input = __interviewly_json.load(__interviewly_sys.stdin)
    __interviewly_deque = Deque()
    __interviewly_result = []

    for operation in __interviewly_input['operations']:
        name = operation[0]
        value = operation[1] if len(operation) > 1 else None

        if name == 'pushFront':
            __interviewly_deque.push_front(value)
        elif name == 'pushBack':
            __interviewly_deque.push_back(value)
        elif name == 'popFront':
            __interviewly_result.append(__interviewly_deque.pop_front())
        elif name == 'popBack':
            __interviewly_result.append(__interviewly_deque.pop_back())
        elif name == 'peekFront':
            __interviewly_result.append(__interviewly_deque.peek_front())
        elif name == 'peekBack':
            __interviewly_result.append(__interviewly_deque.peek_back())
        elif name == 'size':
            __interviewly_result.append(__interviewly_deque.size())
        elif name == 'isEmpty':
            __interviewly_result.append(__interviewly_deque.is_empty())
        else:
            raise ValueError(f'Неизвестная операция: {name}')

    __interviewly_sys.stdout.write(
        __interviewly_json.dumps(__interviewly_result, ensure_ascii=False)
    )


__interviewly_run()`;

export default [
  {
    id: '00000000-0000-4000-8000-000000000201',
    slug: 'sum-all-numbers',
    title: 'Сумма всех чисел',
    description:
      'Реализуйте функцию solve(params), которая возвращает сумму всех чисел из массива params.numbers. Для пустого массива верните 0.',
    difficulty: ProgrammingTaskDifficulty.EASY,
    isActive: true,
    variants: [
      {
        language: EditorLanguage.JAVASCRIPT,
        starterCode: `function solve(params) {
  // Напишите решение здесь
}`,
        harnessCode: javascriptSolveHarness,
      },
      {
        language: EditorLanguage.TYPESCRIPT,
        starterCode: `type SumParams = {
  numbers: number[];
};

function solve(params: SumParams): number {
  // Напишите решение здесь
  return 0;
}`,
        harnessCode: typescriptSolveHarness,
      },
      {
        language: EditorLanguage.PYTHON,
        starterCode: `def solve(params):
    # Напишите решение здесь
    return 0`,
        harnessCode: pythonSolveHarness,
      },
    ],
    testCases: [
      {
        position: 0,
        name: 'Положительные числа',
        input: { numbers: [1, 2, 3, 4, 5] },
        expectedOutput: 15,
      },
      {
        position: 1,
        name: 'Пустой массив',
        input: { numbers: [] },
        expectedOutput: 0,
      },
      {
        position: 2,
        name: 'Положительные и отрицательные числа',
        input: { numbers: [-10, 4, 6, -2, 7] },
        expectedOutput: 5,
      },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000202',
    slug: 'sort-number-array',
    title: 'Сортировка массива чисел',
    description:
      'Реализуйте функцию solve(params), которая возвращает числа из массива params.numbers, отсортированные по возрастанию. Не изменяйте исходный массив.',
    difficulty: ProgrammingTaskDifficulty.EASY,
    isActive: true,
    variants: [
      {
        language: EditorLanguage.JAVASCRIPT,
        starterCode: `function solve(params) {
  // Напишите решение здесь
}`,
        harnessCode: javascriptSolveHarness,
      },
      {
        language: EditorLanguage.TYPESCRIPT,
        starterCode: `type SortParams = {
  numbers: number[];
};

function solve(params: SortParams): number[] {
  // Напишите решение здесь
  return [];
}`,
        harnessCode: typescriptSolveHarness,
      },
      {
        language: EditorLanguage.PYTHON,
        starterCode: `def solve(params):
    # Напишите решение здесь
    return []`,
        harnessCode: pythonSolveHarness,
      },
    ],
    testCases: [
      {
        position: 0,
        name: 'Неотсортированный массив',
        input: { numbers: [5, 2, 9, 1, 3] },
        expectedOutput: [1, 2, 3, 5, 9],
      },
      {
        position: 1,
        name: 'Повторяющиеся значения',
        input: { numbers: [3, 1, 3, 2, 1] },
        expectedOutput: [1, 1, 2, 3, 3],
      },
      {
        position: 2,
        name: 'Отрицательные числа и ноль',
        input: { numbers: [0, -10, 8, -3, 8, 2] },
        expectedOutput: [-10, -3, 0, 2, 8, 8],
      },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000203',
    slug: 'double-ended-queue',
    title: 'Двусторонняя очередь',
    description:
      'Реализуйте класс Deque — двустороннюю очередь. Он должен добавлять, удалять и читать элементы с обоих концов, возвращать текущий размер и сообщать, пуста ли очередь. Удаление или чтение из пустой очереди должно возвращать null (в Python — None). Не используйте готовую реализацию deque.',
    difficulty: ProgrammingTaskDifficulty.MEDIUM,
    isActive: true,
    variants: [
      {
        language: EditorLanguage.JAVASCRIPT,
        starterCode: `class Deque {
  pushFront(value) {}
  pushBack(value) {}
  popFront() {}
  popBack() {}
  peekFront() {}
  peekBack() {}
  size() {}
  isEmpty() {}
}`,
        harnessCode: javascriptDequeHarness,
      },
      {
        language: EditorLanguage.TYPESCRIPT,
        starterCode: `class Deque<T> {
  pushFront(value: T): void {}
  pushBack(value: T): void {}
  popFront(): T | null { return null; }
  popBack(): T | null { return null; }
  peekFront(): T | null { return null; }
  peekBack(): T | null { return null; }
  size(): number { return 0; }
  isEmpty(): boolean { return true; }
}`,
        harnessCode: typescriptDequeHarness,
      },
      {
        language: EditorLanguage.PYTHON,
        starterCode: `class Deque:
    def push_front(self, value):
        pass

    def push_back(self, value):
        pass

    def pop_front(self):
        pass

    def pop_back(self):
        pass

    def peek_front(self):
        pass

    def peek_back(self):
        pass

    def size(self):
        return 0

    def is_empty(self):
        return True`,
        harnessCode: pythonDequeHarness,
      },
    ],
    testCases: [
      {
        position: 0,
        name: 'Операции с обоими концами',
        input: {
          operations: [
            ['pushBack', 1],
            ['pushFront', 2],
            ['peekFront'],
            ['peekBack'],
            ['popFront'],
            ['popBack'],
            ['isEmpty'],
          ],
        },
        expectedOutput: [2, 1, 2, 1, true],
      },
      {
        position: 1,
        name: 'Размер очереди',
        input: {
          operations: [
            ['size'],
            ['pushBack', 10],
            ['pushBack', 20],
            ['size'],
            ['popFront'],
            ['size'],
          ],
        },
        expectedOutput: [0, 2, 10, 1],
      },
      {
        position: 2,
        name: 'Операции с пустой очередью',
        input: {
          operations: [
            ['popFront'],
            ['popBack'],
            ['peekFront'],
            ['peekBack'],
            ['isEmpty'],
          ],
        },
        expectedOutput: [null, null, null, null, true],
      },
    ],
  },
];
