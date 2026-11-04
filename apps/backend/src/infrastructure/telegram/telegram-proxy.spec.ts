import { describe, expect, it } from 'vitest';
import { normalizeTelegramProxyUrl } from './telegram-proxy.ts';

describe('normalizeTelegramProxyUrl', () => {
  it('добавляет http:// к user:pass@host:port', () => {
    expect(normalizeTelegramProxyUrl('user:pass@1.2.3.4:41164')).toBe('http://user:pass@1.2.3.4:41164');
  });

  it('оставляет URL со схемой', () => {
    expect(normalizeTelegramProxyUrl('http://u:p@host:8080')).toBe('http://u:p@host:8080');
    expect(normalizeTelegramProxyUrl('socks5://u:p@host:1080')).toBe('socks5://u:p@host:1080');
  });

  it('отклоняет пустую строку', () => {
    expect(() => normalizeTelegramProxyUrl('  ')).toThrow(/empty/);
  });
});
