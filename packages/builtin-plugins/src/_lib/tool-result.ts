import type { ToolResult } from '@meewmeew/plugin-sdk';

export function toolSuccess(text: string): ToolResult {
  return { content: [{ type: 'text', text }] };
}

export function toolError(msg: string): ToolResult {
  return { content: [{ type: 'text', text: msg }], isError: true };
}
