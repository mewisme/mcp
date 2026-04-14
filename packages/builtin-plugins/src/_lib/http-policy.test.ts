import { describe, expect, it } from 'vitest';
import { validateHttpUrl } from './http-policy.js';

describe('validateHttpUrl', () => {
  it('allows https URLs', () => {
    const r = validateHttpUrl('https://example.com/path');
    expect(r.ok).toBe(true);
  });

  it('allows localhost', () => {
    expect(validateHttpUrl('http://localhost/foo').ok).toBe(true);
  });

  it('allows private IPv4', () => {
    expect(validateHttpUrl('http://192.168.1.1/').ok).toBe(true);
  });

  it('rejects invalid URL', () => {
    expect(validateHttpUrl('not a url').ok).toBe(false);
  });

  it('rejects non-http(s) schemes', () => {
    expect(validateHttpUrl('file:///etc/passwd').ok).toBe(false);
  });
});
