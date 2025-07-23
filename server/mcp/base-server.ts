// Base MCP Server Implementation
import { EventEmitter } from 'events';
import { 
  MCPRequest, 
  MCPResponse, 
  MCPError, 
  MCPTool, 
  MCPToolCall, 
  MCPToolResult,
  MCPServerCapabilities,
  MCPServerInfo
} from './types';

export abstract class BaseMCPServer extends EventEmitter {
  protected tools: Map<string, MCPTool> = new Map();
  protected capabilities: MCPServerCapabilities;
  protected serverInfo: MCPServerInfo;

  constructor(name: string, version: string) {
    super();
    this.serverInfo = {
      name,
      version,
      capabilities: {
        tools: {
          listChanged: true
        }
      }
    };
    this.capabilities = this.serverInfo.capabilities;
  }

  // Abstract methods that must be implemented by concrete servers
  abstract initialize(): Promise<void>;
  abstract executeTool(call: MCPToolCall): Promise<MCPToolResult>;

  // Register a tool with the server
  protected registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
  }

  // Get list of available tools
  public getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  // Handle MCP requests
  public async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'tools/list':
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              tools: this.getTools()
            }
          };

        case 'tools/call':
          const toolCall = request.params as MCPToolCall;
          const result = await this.executeTool(toolCall);
          return {
            jsonrpc: "2.0",
            id: request.id,
            result
          };

        case 'initialize':
          await this.initialize();
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: this.capabilities,
              serverInfo: this.serverInfo
            }
          };

        default:
          throw this.createError(-32601, `Method not found: ${request.method}`);
      }
    } catch (error) {
      const mcpError = error instanceof Error && 'code' in error 
        ? error as MCPError 
        : this.createError(-32603, `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: mcpError
      };
    }
  }

  // Helper method to create MCP errors
  protected createError(code: number, message: string, data?: any): MCPError {
    return { code, message, data };
  }

  // Validate tool arguments against schema
  protected validateToolArguments(tool: MCPTool, args: Record<string, any>): void {
    const schema = tool.inputSchema;
    
    // Check required fields
    if (schema.required) {
      for (const required of schema.required) {
        if (!(required in args)) {
          throw this.createError(-32602, `Missing required parameter: ${required}`);
        }
      }
    }

    // Basic type checking for properties
    if (schema.properties) {
      for (const [key, value] of Object.entries(args)) {
        if (key in schema.properties) {
          const propSchema = schema.properties[key];
          if (propSchema.type && typeof value !== propSchema.type) {
            throw this.createError(-32602, `Invalid type for parameter ${key}: expected ${propSchema.type}, got ${typeof value}`);
          }
        }
      }
    }
  }
}