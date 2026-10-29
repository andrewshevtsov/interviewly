import { describe, expect, it } from 'vitest';
import { slugify } from './slugify.ts';

describe('slugify', () => {
  it('транслитерирует кириллицу и склеивает слова дефисами', () => {
    expect(slugify('Сумма элементов массива')).toBe('summa-elementov-massiva');
  });

  it('убирает диакритику у латинских букв', () => {
    expect(slugify('Héllo Wörld!!!')).toBe('hello-world');
  });

  it('возвращает пустую строку для пустого или пробельного значения', () => {
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
  });

  it('ограничивает длину результата', () => {
    const longTitle = 'a'.repeat(200);
    expect(slugify(longTitle)).toHaveLength(100);
  });
});
