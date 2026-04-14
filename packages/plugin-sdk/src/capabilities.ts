/**
 * Standard MCP Capability Shapes
 */

export interface ToolCapability {
  name: string;
  description: string;
  inputSchema: unknown; // Defines expected input shape
}

export interface ResourceCapability {
  uriTemplate: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface PromptCapability {
  name: string;
  description?: string;
  arguments?: {
    name: string;
    description?: string;
    required?: boolean;
  }[];
}

export interface ToolResult {
  content: { type: 'text' | 'image' | 'resource'; text?: string; data?: string; mimeType?: string; resource?: any }[];
  isError?: boolean;
}

export interface RegisteredTool extends ToolCapability {
  handler: (input: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ResourceResult {
  contents: { uri: string; mimeType?: string; text?: string; blob?: string }[];
}

export interface RegisteredResource extends ResourceCapability {
  handler: (uri: string) => Promise<ResourceResult>;
}

export interface PromptMessage {
  role: 'user' | 'assistant';
  content: { type: 'text' | 'resource'; text?: string; resource?: any };
}

export interface PromptResult {
  description?: string;
  messages: PromptMessage[];
}

export interface RegisteredPrompt extends PromptCapability {
  handler: (args?: Record<string, string>) => Promise<PromptResult>;
}
