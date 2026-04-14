import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import { validateHttpUrl } from '../../_lib/http-policy.js';
import { toolError, toolSuccess } from '../../_lib/tool-result.js';

const MAX_BODY_BYTES = 512 * 1024;
const REDACT_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'proxy-authorization',
]);

function sanitizeHeaders(h: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  h.forEach((value, key) => {
    const lower = key.toLowerCase();
    out[key] = REDACT_HEADERS.has(lower) ? '[redacted]' : value;
  });
  return out;
}

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

export function createHttpFetchTool(): RegisteredTool {
  return {
    name: 'http_fetch',
    description: 'Performs an HTTP(S) request to any host (only http and https schemes are allowed).',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        method: { type: 'string', description: 'HTTP method', default: 'GET' },
        headers: { type: 'object', additionalProperties: { type: 'string' }, description: 'Optional request headers' },
        body: { type: 'string', description: 'Optional raw body (UTF-8)' },
      },
      required: ['url'],
    },
    handler: async (args) => {
      try {
        const rawUrl = String(args.url);
        const policy = validateHttpUrl(rawUrl);
        if (!policy.ok) {
          return toolError(policy.reason);
        }

        const methodRaw = args.method !== undefined ? String(args.method).toUpperCase() : 'GET';
        if (!ALLOWED_METHODS.has(methodRaw)) {
          return toolError(`Unsupported method: ${methodRaw}`);
        }

        const headersInit = args.headers && typeof args.headers === 'object' ? (args.headers as Record<string, string>) : {};
        const body =
          args.body !== undefined && methodRaw !== 'GET' && methodRaw !== 'HEAD' ? String(args.body) : undefined;

        const res = await fetch(policy.url, {
          method: methodRaw,
          headers: headersInit,
          body,
          redirect: 'manual',
        });

        const buf = await res.arrayBuffer();
        let truncated = false;
        let slice = buf;
        if (buf.byteLength > MAX_BODY_BYTES) {
          truncated = true;
          slice = buf.slice(0, MAX_BODY_BYTES);
        }
        const text = new TextDecoder('utf8', { fatal: false }).decode(slice);

        const payload = {
          status: res.status,
          statusText: res.statusText,
          responseHeaders: sanitizeHeaders(res.headers),
          bodyText: text,
          bodyTruncated: truncated,
          bodyBytes: buf.byteLength,
        };
        return toolSuccess(JSON.stringify(payload, null, 2));
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    },
  };
}
