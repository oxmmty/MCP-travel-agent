import { MCPClient } from '../mcp/client';
import { OpenAI } from 'openai';
import { storage } from '../storage';
import type { AgentTask, InsertAgentTask } from '@shared/schema';

export interface AgentTaskInput {
  type: string;
  data: any;
  chatId: number;
  context?: any;
}

export interface AgentTaskResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: any;
}

export abstract class BaseAgent {
  protected mcpClient: MCPClient;
  protected openai: OpenAI;
  protected agentId: number;
  
  constructor(agentId: number) {
    this.agentId = agentId;
    this.mcpClient = new MCPClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  abstract execute(task: AgentTaskInput): Promise<AgentTaskResult>;

  protected async callMCPTool(toolName: string, args: any): Promise<any> {
    try {
      const result = await this.mcpClient.executeTool({
        name: toolName,
        arguments: args
      });
      
      if (result.isError) {
        throw new Error(result.content[0]?.text || 'MCP tool call failed');
      }
      
      return JSON.parse(result.content[0]?.text || '{}');
    } catch (error) {
      console.error(`MCP tool call failed for ${toolName}:`, error);
      throw error;
    }
  }

  protected async askLLM(prompt: string, context?: any, systemPrompt?: string): Promise<string> {
    try {
      const messages: any[] = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      if (context) {
        messages.push({ 
          role: 'user', 
          content: `Context: ${JSON.stringify(context, null, 2)}\n\nQuery: ${prompt}` 
        });
      } else {
        messages.push({ role: 'user', content: prompt });
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('LLM call failed:', error);
      throw error;
    }
  }

  protected async createTask(input: AgentTaskInput): Promise<AgentTask> {
    const taskData: InsertAgentTask = {
      agentId: this.agentId,
      chatId: input.chatId,
      taskType: input.type,
      input: input.data,
      output: null,
      status: 'pending',
      error: null
    };

    return await storage.createAgentTask(taskData);
  }

  protected async updateTask(taskId: number, updates: Partial<AgentTask>): Promise<void> {
    await storage.updateAgentTask(taskId, updates);
  }

  protected async completeTask(taskId: number, result: AgentTaskResult): Promise<void> {
    await storage.updateAgentTask(taskId, {
      output: result.data,
      status: result.success ? 'completed' : 'failed',
      error: result.error || null,
      completedAt: new Date()
    });
  }

  async executeWithTracking(input: AgentTaskInput): Promise<AgentTaskResult> {
    const task = await this.createTask(input);
    
    try {
      await this.updateTask(task.id, { 
        status: 'running', 
        executedAt: new Date() 
      });

      const result = await this.execute(input);
      
      await this.completeTask(task.id, result);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const result: AgentTaskResult = {
        success: false,
        error: errorMessage
      };
      
      await this.completeTask(task.id, result);
      
      return result;
    }
  }
}