import type { ToolResult } from '@meewmeew/plugin-sdk';

export function toolSuccess(text: string): ToolResult {
  return { content: [{ type: 'text', text }] };
}

export function toolError(text: string): ToolResult {
  return { content: [{ type: 'text', text }], isError: true };
}
