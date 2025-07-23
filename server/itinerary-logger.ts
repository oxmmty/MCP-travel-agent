import { EventEmitter } from 'events';

export interface ItineraryLogEntry {
  id: string;
  chatId: number;
  timestamp: number;
  agent: string;
  action: string;
  status: 'started' | 'progress' | 'completed' | 'error';
  details?: string;
  progress?: number;
  data?: any;
}

export class ItineraryLogger extends EventEmitter {
  private logs: Map<string, ItineraryLogEntry[]> = new Map();
  private activeGenerations: Map<number, string> = new Map();

  startGeneration(chatId: number): string {
    const generationId = `gen-${chatId}-${Date.now()}`;
    this.activeGenerations.set(chatId, generationId);
    this.logs.set(generationId, []);
    
    this.log(generationId, chatId, 'orchestrator', 'generation_started', 'started', 'Starte Reiseplan-Generierung...', 0);
    return generationId;
  }

  log(
    generationId: string,
    chatId: number,
    agent: string,
    action: string,
    status: ItineraryLogEntry['status'],
    details?: string,
    progress?: number,
    data?: any
  ) {
    const entry: ItineraryLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      chatId,
      timestamp: Date.now(),
      agent,
      action,
      status,
      details,
      progress,
      data
    };

    const generationLogs = this.logs.get(generationId) || [];
    generationLogs.push(entry);
    this.logs.set(generationId, generationLogs);

    // Emit event for real-time updates
    this.emit('log', entry);
    
    console.log(`[${agent.toUpperCase()}] ${action}: ${details || status} ${progress !== undefined ? `(${progress}%)` : ''}`);
  }

  getGenerationLogs(chatId: number): ItineraryLogEntry[] {
    const generationId = this.activeGenerations.get(chatId);
    if (!generationId) return [];
    
    return this.logs.get(generationId) || [];
  }

  getCurrentStatus(chatId: number): { agent: string; action: string; details?: string; progress?: number } | null {
    const logs = this.getGenerationLogs(chatId);
    if (logs.length === 0) return null;

    // Find the latest active log (not completed or error)
    const activeLogs = logs.filter(log => log.status === 'started' || log.status === 'progress');
    if (activeLogs.length === 0) {
      // If no active logs, get the last completed one
      const lastLog = logs[logs.length - 1];
      return {
        agent: lastLog.agent,
        action: lastLog.action,
        details: lastLog.details,
        progress: lastLog.progress
      };
    }

    const currentLog = activeLogs[activeLogs.length - 1];
    return {
      agent: currentLog.agent,
      action: currentLog.action,
      details: currentLog.details,
      progress: currentLog.progress
    };
  }

  completeGeneration(chatId: number) {
    const generationId = this.activeGenerations.get(chatId);
    if (!generationId) return;

    this.log(generationId, chatId, 'orchestrator', 'generation_completed', 'completed', 'Reiseplan erfolgreich erstellt!', 100);
    
    // Keep logs for 5 minutes after completion
    setTimeout(() => {
      this.logs.delete(generationId);
      this.activeGenerations.delete(chatId);
    }, 5 * 60 * 1000);
  }

  errorGeneration(chatId: number, error: string) {
    const generationId = this.activeGenerations.get(chatId);
    if (!generationId) return;

    this.log(generationId, chatId, 'orchestrator', 'generation_error', 'error', error, 0);
  }

  // Agent-specific logging methods
  logDestinationAgent(chatId: number, action: string, details?: string, progress?: number) {
    const generationId = this.activeGenerations.get(chatId);
    if (!generationId) return;

    const status = progress === 100 ? 'completed' : (progress === 0 ? 'started' : 'progress');
    this.log(generationId, chatId, 'destination_agent', action, status, details, progress);
  }

  logItineraryAgent(chatId: number, action: string, details?: string, progress?: number) {
    const generationId = this.activeGenerations.get(chatId);
    if (!generationId) return;

    const status = progress === 100 ? 'completed' : (progress === 0 ? 'started' : 'progress');
    this.log(generationId, chatId, 'itinerary_agent', action, status, details, progress);
  }

  logDataIntegration(chatId: number, action: string, details?: string, progress?: number) {
    const generationId = this.activeGenerations.get(chatId);
    if (!generationId) return;

    const status = progress === 100 ? 'completed' : (progress === 0 ? 'started' : 'progress');
    this.log(generationId, chatId, 'data_integration', action, status, details, progress);
  }
}

export const itineraryLogger = new ItineraryLogger();