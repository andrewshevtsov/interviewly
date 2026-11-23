import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { defangLinks, findLinks } from './links.ts';
import { NoLinks } from './no-links.decorator.ts';

describe('findLinks', () => {
  it.each([
    ['Зайди на https://evil.com/login', ['evil.com']],
    ['http://EVIL.com.', ['evil.com']],
    ['www.evil.quest', ['www.evil.quest']],
    ['пиши в t.me/fake_support', ['t.me']],
    ['evil.com, bit.ly/x и снова evil.com', ['evil.com', 'bit.ly']],
    ['вход: interviewly.ru.evil.top/auth', ['interviewly.ru.evil.top']],
    ['https://interviewly.com@evil.com/', ['evil.com']],
    ['почта support@evil.com', ['evil.com']],
    ['tg://resolve?domain=fake', ['resolve']],
  ])('находит ссылку в «%s»', (text, hosts) => {
    expect(findLinks(text)).toEqual(hosts);
  });

  it('кириллический домен отдаёт в punycode, как его увидит браузер', () => {
    expect(findLinks('сайт пример.рф')).toEqual(['xn--e1afmkfd.xn--p1ai']);
  });

  it.each([
    'Интервью по Node.js и Next.js',
    'ASP.NET Core, Socket.IO, .NET 8',
    'Не подходит время.Давайте в другой день',
    'т.е. в 15.30, версия 1.2.3',
    'файлы index.ts и app.module.ts',
    'Иван А.С.',
    'and/or',
  ])('не считает ссылкой «%s»', (text) => {
    expect(findLinks(text)).toEqual([]);
  });
});

describe('defangLinks', () => {
  it.each([
    ['https://evil.com/a.html', 'https[://]evil[.]com/a[.]html'],
    ['зайди на evil.quest сейчас', 'зайди на evil[.]quest сейчас'],
    ['пиши @fake_support_bot', 'пиши @ fake_support_bot'],
    ['почта a@evil.com', 'почта a@ evil[.]com'],
    ['пример.рф', 'пример[.]рф'],
  ])('обезвреживает «%s»', (text, safe) => {
    expect(defangLinks(text)).toBe(safe);
  });

  it('обычный текст не меняет', () => {
    const text = 'Не подходит время.Давайте в 15.30, т.е. позже';

    expect(defangLinks(text)).toBe(text);
  });
});

describe('NoLinks', () => {
  class Dto {
    @NoLinks()
    text?: unknown;
  }

  const errorsFor = (text: unknown) =>
    validate(Object.assign(new Dto(), { text }));

  it('отклоняет текст со ссылкой и называет поле', async () => {
    const [error] = await errorsFor('см. evil.com');

    expect(error?.constraints).toEqual({
      noLinks: 'text must not contain links',
    });
  });

  it.each(['Иван', 'Знаю Node.js', undefined, 42])(
    'пропускает %j',
    async (text) => {
      await expect(errorsFor(text)).resolves.toEqual([]);
    },
  );
});
