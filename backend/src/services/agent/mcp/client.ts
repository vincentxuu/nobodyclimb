export interface MCPServerConfig {
  name: string
  url: string
  transport: 'streamable_http' | 'sse'
  auth_type: 'none' | 'api_key' | 'oauth'
  secret_ref: string | null
}

export interface MCPToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export interface MCPToolResult {
  content: Array<{ type: string; text?: string; [k: string]: unknown }>
  isError?: boolean
}

export class WorkersMCPClient {
  constructor(
    private config: MCPServerConfig,
    private authToken?: string
  ) {}

  async listTools(): Promise<MCPToolDefinition[]> {
    const response = await fetch(this.config.url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: crypto.randomUUID(),
      }),
    })
    if (!response.ok) throw new Error(`MCP listTools failed: ${response.status}`)
    const json = (await response.json()) as {
      result?: { tools?: MCPToolDefinition[] }
      error?: unknown
    }
    if (json.error) throw new Error(`MCP error: ${JSON.stringify(json.error)}`)
    return json.result?.tools ?? []
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    const response = await fetch(this.config.url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name, arguments: args },
        id: crypto.randomUUID(),
      }),
    })
    if (!response.ok) throw new Error(`MCP callTool failed: ${response.status}`)
    const json = (await response.json()) as { result?: MCPToolResult; error?: unknown }
    if (json.error) throw new Error(`MCP error: ${JSON.stringify(json.error)}`)
    return json.result ?? { content: [] }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'nobodyclimb', version: '1.0' },
          },
          id: crypto.randomUUID(),
        }),
      })
      return response.ok
    } catch {
      return false
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.config.auth_type === 'api_key' && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }
    return headers
  }
}
