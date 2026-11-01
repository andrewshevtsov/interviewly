import { request as httpRequest } from 'node:http';
import type { Socket } from 'node:net';
import { connect as tlsConnect } from 'node:tls';
import { URL } from 'node:url';

export function normalizeTelegramProxyUrl(raw: string): string {
  const value = raw.trim();
  if (!value) {
    throw new Error('TG_PROXY is empty');
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    return value;
  }
  return `http://${value}`;
}

interface ProxyFetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

export function fetchViaHttpProxy(
  targetUrl: string,
  proxyUrl: string,
  init: ProxyFetchInit = {},
): Promise<Response> {
  const target = new URL(targetUrl);
  const proxy = new URL(proxyUrl);
  if (target.protocol !== 'https:') {
    return Promise.reject(new Error(`Telegram proxy supports only https targets, got ${target.protocol}`));
  }

  const method = init.method ?? 'GET';
  const headers = { ...init.headers };
  const body = init.body;
  const signal = init.signal;

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      reject(signal?.reason instanceof Error ? signal.reason : new Error('Aborted'));
    };
    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener('abort', onAbort, { once: true });

    const proxyAuth =
      proxy.username || proxy.password
        ? Buffer.from(
            `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`,
          ).toString('base64')
        : undefined;

    const connectReq = httpRequest({
      host: proxy.hostname,
      port: proxy.port ? Number(proxy.port) : 80,
      method: 'CONNECT',
      path: `${target.hostname}:${target.port || 443}`,
      headers: {
        Host: `${target.hostname}:${target.port || 443}`,
        ...(proxyAuth ? { 'Proxy-Authorization': `Basic ${proxyAuth}` } : {}),
      },
    });

    const fail = (error: Error) => {
      signal?.removeEventListener('abort', onAbort);
      connectReq.destroy();
      reject(error);
    };

    connectReq.once('connect', (connectRes, socket: Socket) => {
      if (connectRes.statusCode !== 200) {
        socket.destroy();
        fail(new Error(`Proxy CONNECT failed: ${connectRes.statusCode}`));
        return;
      }

      const tlsSocket = tlsConnect({
        socket,
        host: target.hostname,
        servername: target.hostname,
      });

      tlsSocket.once('error', fail);
      tlsSocket.once('secureConnect', () => {
        const requestPath = `${target.pathname}${target.search}`;
        const headerLines = [
          `${method} ${requestPath} HTTP/1.1`,
          `Host: ${target.host}`,
          ...Object.entries(headers).map(([key, value]) => `${key}: ${value}`),
          ...(body ? [`Content-Length: ${Buffer.byteLength(body)}`] : []),
          'Connection: close',
          '',
          '',
        ].join('\r\n');

        tlsSocket.write(headerLines);
        if (body) {
          tlsSocket.write(body);
        }

        const chunks: Buffer[] = [];
        tlsSocket.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        tlsSocket.on('end', () => {
          signal?.removeEventListener('abort', onAbort);
          try {
            resolve(parseHttpResponse(Buffer.concat(chunks)));
          } catch (error: unknown) {
            fail(error instanceof Error ? error : new Error(String(error)));
          }
        });
      });
    });

    connectReq.on('error', fail);
    connectReq.end();
  });
}

function parseHttpResponse(raw: Buffer): Response {
  const separator = raw.indexOf('\r\n\r\n');
  if (separator < 0) {
    throw new Error('Proxy upstream returned malformed HTTP response');
  }
  const head = raw.subarray(0, separator).toString('latin1');
  const body = raw.subarray(separator + 4);
  const lines = head.split('\r\n');
  const statusLine = lines[0] ?? '';
  const match = /^HTTP\/\d(?:\.\d)?\s+(\d{3})(?:\s+(.*))?$/i.exec(statusLine);
  if (!match) {
    throw new Error(`Proxy upstream bad status line: ${statusLine}`);
  }
  const status = Number(match[1]);
  const statusText = match[2] ?? '';
  const responseHeaders = new Headers();
  for (const line of lines.slice(1)) {
    const colon = line.indexOf(':');
    if (colon <= 0) {
      continue;
    }
    responseHeaders.append(line.slice(0, colon).trim(), line.slice(colon + 1).trim());
  }
  return new Response(body, { status, statusText, headers: responseHeaders });
}
