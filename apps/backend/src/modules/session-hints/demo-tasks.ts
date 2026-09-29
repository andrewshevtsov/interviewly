// Временные демо-задачи «условие + код», пока нет реалтайм-редактора. Интервьюер
// переключает их в комнате, модель получает текущую задачу при запросе подсказки.
// Включаются AI_HINTS_DEMO_CONTEXT=true; удалить вместе с флагом и Session.demoTaskIndex.

export type DemoTaskLanguage = 'JAVASCRIPT' | 'TYPESCRIPT';

export type DemoTask = {
  language: DemoTaskLanguage;
  task: string;
  code: string;
};

export const DEMO_TASKS: readonly DemoTask[] = [
  {
    language: 'TYPESCRIPT',
    task: 'Дан массив чисел nums и число target. Верните индексы двух разных элементов, сумма которых равна target.',
    code: `function twoSum(nums: number[], target: number): number[] {
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return [];
}`,
  },
  {
    language: 'JAVASCRIPT',
    task: 'Проверьте, что в строке из скобок ()[]{} все скобки закрыты в правильном порядке.',
    code: `function isValid(s) {
  let count = 0;
  for (const ch of s) {
    count += '([{'.includes(ch) ? 1 : -1;
  }
  return count === 0;
}`,
  },
  {
    language: 'TYPESCRIPT',
    task: 'Разверните односвязный список на месте и верните новую голову.',
    code: `function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  while (head) {
    head.next = prev;
    head = head.next;
  }
  return prev;
}`,
  },
  {
    language: 'JAVASCRIPT',
    task: 'Найдите первый символ строки, который встречается в ней ровно один раз. Если такого нет, верните null.',
    code: `function firstUnique(s) {
  for (const ch of s) {
    if (s.indexOf(ch) === s.lastIndexOf(ch)) return ch;
  }
}`,
  },
  {
    language: 'TYPESCRIPT',
    task: 'Определите, являются ли две строки анаграммами друг друга.',
    code: `function isAnagram(a: string, b: string): boolean {
  for (const ch of a) {
    if (!b.includes(ch)) return false;
  }
  return true;
}`,
  },
  {
    language: 'JAVASCRIPT',
    task: 'Реализуйте бинарный поиск: верните индекс target в отсортированном массиве или -1.',
    code: `function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] < target) left = mid;
    else right = mid;
  }
  return -1;
}`,
  },
  {
    language: 'TYPESCRIPT',
    task: 'Найдите максимальную сумму непрерывного подмассива.',
    code: `function maxSubarray(nums: number[]): number {
  let best = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i; j < nums.length; j++) {
      best = Math.max(best, nums.slice(i, j).reduce((a, b) => a + b, 0));
    }
  }
  return best;
}`,
  },
  {
    language: 'JAVASCRIPT',
    task: 'Слейте два отсортированных массива в один отсортированный, не используя sort().',
    code: `function merge(a, b) {
  const result = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] < b[j]) result.push(a[i++]);
  }
  return result;
}`,
  },
  {
    language: 'TYPESCRIPT',
    task: 'Проверьте, является ли строка палиндромом, учитывая только буквы и цифры и не различая регистр.',
    code: `function isPalindrome(s: string): boolean {
  return s === s.split('').reverse().join('');
}`,
  },
  {
    language: 'JAVASCRIPT',
    task: 'Удалите дубликаты из отсортированного массива на месте и верните количество уникальных элементов.',
    code: `function removeDuplicates(nums) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === nums[i + 1]) nums.splice(i, 1);
  }
  return nums.length;
}`,
  },
];

/**
 * Номер следующей задачи. Первая зависит от сессии - так в разных комнатах
 * стартуют разные задачи, дальше задачи идут по кругу.
 */
export function nextDemoTaskIndex(sessionId: string, current: number | null): number {
  if (current === null) {
    const sessionOffset = [...sessionId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return sessionOffset % DEMO_TASKS.length;
  }
  return (current + 1) % DEMO_TASKS.length;
}
