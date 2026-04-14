import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Resource, Prompt } from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MCPRuntimeRegistry } from '../mcp-runtime/index.js';
import { createConsoleLogger } from '@meewmeew/shared';
import type { RegisteredResource, RegisteredPrompt, PromptResult } from '@meewmeew/plugin-sdk';

const logger = createConsoleLogger('MCPServerAdapter');

export class MCPServerAdapter {
  private server: Server;
  /** Set after `connectStdio()` resolves; SDK notifications require an active transport. */
  private transportConnected = false;

  constructor(private runtimeRegistry: MCPRuntimeRegistry, serverName: string, serverVersion: string = '1.0.0') {
    this.server = new Server(
      {
        name: serverName,
        version: serverVersion,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      },
    );

    this.registerRequestHandlers();
  }

  private registeredResourceToMcp(r: RegisteredResource): Resource {
    return {
      name: r.name,
      uri: r.uriTemplate,
      description: r.description,
      mimeType: r.mimeType,
    };
  }

  private registeredPromptToMcp(p: RegisteredPrompt): Prompt {
    return {
      name: p.name,
      description: p.description,
      arguments: p.arguments,
    };
  }

  private mapPromptResult(result: PromptResult) {
    return {
      description: result.description,
      messages: result.messages.map((m) => {
        const content = m.content;
        if (content.type === 'text') {
          return {
            role: m.role,
            content: { type: 'text' as const, text: content.text ?? '' },
          };
        }
        const res = content.resource;
        return {
          role: m.role,
          content: {
            type: 'resource' as const,
            resource: {
              uri: typeof res?.uri === 'string' ? res.uri : '',
              mimeType: typeof res?.mimeType === 'string' ? res.mimeType : undefined,
              text: typeof res?.text === 'string' ? res.text : undefined,
            },
          },
        };
      }),
    };
  }

  private registerRequestHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.runtimeRegistry.getTools();
      return {
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema as Record<string, unknown>,
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const internalTools = this.runtimeRegistry.getTools();
      const tool = internalTools.find((t) => t.name === name);

      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }

      try {
        const result = await tool.handler(args || {});
        return {
          content: result.content,
          isError: result.isError,
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Execution fault: ${message}` }],
          isError: true,
        };
      }
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = this.runtimeRegistry.getResources();
      return {
        resources: resources.map((r) => this.registeredResourceToMcp(r)),
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const resources = this.runtimeRegistry.getResources();
      const resource = resources.find((r) => r.uriTemplate === uri);
      if (!resource) {
        throw new Error(`Resource not found for uri: ${uri}`);
      }
      const result = await resource.handler(uri);
      return {
        contents: result.contents.map((c) => {
          if (c.text !== undefined) {
            return { uri: c.uri, mimeType: c.mimeType, text: c.text };
          }
          return {
            uri: c.uri,
            mimeType: c.mimeType,
            blob: c.blob ?? '',
          };
        }),
      };
    });

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts = this.runtimeRegistry.getPrompts();
      return {
        prompts: prompts.map((p) => this.registeredPromptToMcp(p)),
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const name = request.params.name;
      const prompts = this.runtimeRegistry.getPrompts();
      const prompt = prompts.find((p) => p.name === name);
      if (!prompt) {
        throw new Error(`Prompt not found: ${name}`);
      }
      const result = await prompt.handler(request.params.arguments);
      return this.mapPromptResult(result);
    });
  }

  async connectStdio() {
    logger.info('Connecting MCP generic STDIO transport...');
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.transportConnected = true;
  }

  /**
   * Notify the connected client that tool definitions may have changed.
   * Call after dynamic plugin load/unload when using a transport that supports server notifications.
   */
  async notifyToolsChanged(): Promise<void> {
    if (!this.transportConnected) return;
    await this.server.sendToolListChanged();
  }

  async notifyResourcesChanged(): Promise<void> {
    if (!this.transportConnected) return;
    await this.server.sendResourceListChanged();
  }

  async notifyPromptsChanged(): Promise<void> {
    if (!this.transportConnected) return;
    await this.server.sendPromptListChanged();
  }

  /**
   * Notify clients that tools, resources, or prompts may have changed.
   * No-ops until stdio is connected (bootstrap loads plugins before `connectStdio()`).
   */
  async notifyCapabilitiesChanged(): Promise<void> {
    if (!this.transportConnected) return;
    await Promise.all([
      this.server.sendToolListChanged(),
      this.server.sendResourceListChanged(),
      this.server.sendPromptListChanged(),
    ]);
  }
}
