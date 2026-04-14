import { describe, expect, it } from 'vitest';
import { buildCheckTypes, buildRunLint, buildRunTests } from './helpers.js';

describe('test-quality helpers', () => {
  it('buildRunTests adds pnpm filter', () => {
    const inv = buildRunTests('pnpm', '@meewmeew/foo');
    expect(inv.command).toBe('pnpm');
    expect(inv.args).toEqual(['test', '--filter', '@meewmeew/foo']);
  });

  it('buildRunTests npm has no filter', () => {
    const inv = buildRunTests('npm', '@meewmeew/foo');
    expect(inv.args).toEqual(['test']);
  });

  it('buildRunLint bun uses run lint', () => {
    const inv = buildRunLint('bun');
    expect(inv.command).toBe('bun');
    expect(inv.args).toEqual(['run', 'lint']);
  });

  it('buildCheckTypes yarn', () => {
    const inv = buildCheckTypes('yarn');
    expect(inv.args).toEqual(['check-types']);
  });
});
