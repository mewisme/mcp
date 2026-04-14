export type HttpPolicyResult =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

/**
 * Validates URL for fetch: only http and https schemes are allowed; no host or IP restrictions.
 */
export function validateHttpUrl(rawUrl: string): HttpPolicyResult {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'Invalid URL' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'Only http and https URLs are allowed' };
  }

  return { ok: true, url };
}
