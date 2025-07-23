// MCP Client - Manages communication with MCP servers
import { MCPRequest, MCPResponse, MCPTool, MCPToolCall, MCPToolResult } from './types';
import { GoogleMapsMCPServer } from './google-maps-server';
import { StorageMCPServer } from './storage-server';
import { TripAdvisorMCPServer } from './tripadvisor-server';

export class MCPClient {
  private servers: Map<string, any> = new Map();
  private requestId = 1;

  constructor() {
    this.initializeServers();
  }

  private async initializeServers(): Promise<void> {
    // Initialize Google Maps server
    const googleMapsServer = new GoogleMapsMCPServer();
    await googleMapsServer.initialize();
    this.servers.set('google-maps', googleMapsServer);

    // Initialize Storage server
    const storageServer = new StorageMCPServer();
    await storageServer.initialize();
    this.servers.set('storage', storageServer);

    // Initialize TripAdvisor server
    const tripAdvisorServer = new TripAdvisorMCPServer();
    await tripAdvisorServer.initialize();
    this.servers.set('tripadvisor', tripAdvisorServer);
  }

  // Get all available tools from all servers
  public async getAllTools(): Promise<MCPTool[]> {
    const allTools: MCPTool[] = [];
    
    for (const serverEntry of Array.from(this.servers.entries())) {
      const [serverName, server] = serverEntry;
      const tools = server.getTools();
      // Prefix tool names with server name using underscore (OpenAI function names must match ^[a-zA-Z0-9_-]+$)
      const prefixedTools = tools.map((tool: MCPTool) => ({
        ...tool,
        name: `${serverName}_${tool.name}`,
        description: `[${serverName}] ${tool.description}`
      }));
      allTools.push(...prefixedTools);
    }

    return allTools;
  }

  // Execute a tool call
  public async executeTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    const parts = toolCall.name.split('_');
    
    if (parts.length < 2) {
      throw new Error(`Invalid tool name format: ${toolCall.name}. Expected format: server_tool`);
    }

    const serverName = parts[0];
    const toolName = parts.slice(1).join('_'); // Rejoin remaining parts for compound tool names
    
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`Server not found: ${serverName}`);
    }

    // Create modified tool call with original tool name
    const serverToolCall: MCPToolCall = {
      name: toolName,
      arguments: toolCall.arguments
    };

    return await server.executeTool(serverToolCall);
  }

  // Generate tool definitions for OpenAI function calling
  public async getOpenAIFunctions(): Promise<any[]> {
    const tools = await this.getAllTools();
    
    return tools.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }));
  }

  // Convert OpenAI function call to MCP tool call
  public convertOpenAICall(functionCall: any): MCPToolCall {
    return {
      name: functionCall.name,
      arguments: typeof functionCall.arguments === 'string' 
        ? JSON.parse(functionCall.arguments) 
        : functionCall.arguments
    };
  }

  // Execute multiple tools in parallel
  public async executeTools(toolCalls: MCPToolCall[]): Promise<MCPToolResult[]> {
    const promises = toolCalls.map(call => this.executeTool(call));
    return await Promise.all(promises);
  }

  // Get tools for a specific server
  public async getServerTools(serverName: string): Promise<MCPTool[]> {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`Server not found: ${serverName}`);
    }
    return server.getTools();
  }

  // Check if a tool exists
  public async hasTools(toolNames: string[]): Promise<boolean> {
    const availableTools = await this.getAllTools();
    const availableToolNames = new Set(availableTools.map(t => t.name));
    
    return toolNames.every(name => availableToolNames.has(name));
  }
}