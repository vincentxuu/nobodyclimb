import type { Tool, ToolResult } from '../types'
import type { MCPToolDefinition, MCPToolResult, WorkersMCPClient } from './client'

export function adaptMCPTool(
  mcpTool: MCPToolDefinition,
  client: WorkersMCPClient,
  serverName: string
): Tool {
  const qualifiedKey = `${serverName}__${mcpTool.name}`
  return {
    name: qualifiedKey,
    tags: ['mcp', serverName],
    alwaysLoad: false,
    concurrencySafe: true,
    maxResultChars: 3000,
    cacheTTL: 0,
    parameters: mcpTool.inputSchema ?? { type: 'object', properties: {} },
    prompt(): string {
      return mcpTool.description ?? `MCP tool: ${mcpTool.name}`
    },
    async execute(input: unknown): Promise<unknown> {
      return client.callTool(mcpTool.name, (input ?? {}) as Record<string, unknown>)
    },
    formatResult(raw: unknown): ToolResult {
      const result = raw as MCPToolResult
      const text = (result.content ?? [])
        .filter((c) => c.type === 'text')
        .map((c) => c.text ?? '')
        .join('\n')
      return {
        content: text || JSON.stringify(raw),
        metadata: { resultCount: result.content?.length ?? 0 },
      }
    },
  }
}
