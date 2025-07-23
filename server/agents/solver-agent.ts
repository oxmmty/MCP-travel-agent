import { BaseAgent } from './base-agent';
import { storage } from '../storage';
import { getChatCompletion } from '../openai';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { SolverRequest, SolverResponse, InsertSolverResult } from '../../shared/schema';

export interface SolverAgentInput {
  type: 'constraint_validation' | 'plan_verification' | 'optimization';
  data: {
    destination: string;
    startDate?: string;
    endDate?: string;
    duration?: number;
    budget?: number;
    currency?: string;
    preferences: string[];
    constraints?: any;
    hotels?: any[];
    attractions?: any[];
    restaurants?: any[];
    language?: string;
  };
  chatId: number;
  context?: any;
}

export class SolverAgent extends BaseAgent {
  constructor(agentId: number) {
    super(agentId);
  }

  async execute(input: SolverAgentInput): Promise<any> {
    try {
      console.log(`Solver Agent: Starting ${input.type} for ${input.data.destination}`);

      switch (input.type) {
        case 'constraint_validation':
          return await this.validateConstraints(input);
        case 'plan_verification':
          return await this.verifyPlan(input);
        case 'optimization':
          return await this.optimizePlan(input);
        default:
          throw new Error(`Unknown solver task type: ${input.type}`);
      }
    } catch (error) {
      console.error('Solver Agent execution failed:', error);
      throw error;
    }
  }

  private async validateConstraints(input: SolverAgentInput): Promise<any> {
    const { data, chatId } = input;

    try {
      // Schritt 1: Generate SMT problem formulation
      const problemFormulation = await this.generateProblemFormulation(data);

      // Schritt 2: Execute SMT-Solver
      const solverResult = await this.executeSolver(problemFormulation);

      // Schritt 3: Save result in database
      const solverRecord = await storage.createSolverResult({
        chatId,
        tripPlanId: input.context?.tripPlanId || null,
        problemFormulation,
        solverCode: this.generateSolverCode(problemFormulation),
        status: solverResult.status,
        solution: solverResult.solution || null,
        unsatCore: solverResult.unsatCore || null,
        executionTime: solverResult.executionTime || null,
        errorMessage: solverResult.error || null,
      });

      // Schritt 4: Generate improvement suggestions if unsatisfiable
      if (solverResult.status === 'unsatisfiable') {
        const suggestions = await this.generateImprovementSuggestions(
          data,
          solverResult.unsatCore || [],
          data.language || 'de'
        );
        
        return {
          success: false,
          status: 'unsatisfiable',
          unsatCore: solverResult.unsatCore,
          suggestions,
          solverRecord,
          message: 'Die angegebenen Constraints können nicht gleichzeitig erfüllt werden.'
        };
      }

      if (solverResult.status === 'satisfiable') {
        return {
          success: true,
          status: 'satisfiable',
          solution: solverResult.solution,
          solverRecord,
          message: 'Alle Constraints können erfüllt werden. Der Plan ist gültig.',
          executionTime: solverResult.executionTime
        };
      }

      return {
        success: false,
        status: solverResult.status,
        error: solverResult.error,
        solverRecord
      };
    } catch (error) {
      console.error('Solver validation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown solver error',
        status: 'error'
      };
    }
  }

  private async verifyPlan(input: SolverAgentInput): Promise<any> {
    // Ähnlich wie validateConstraints, aber für bestehende Pläne
    return await this.validateConstraints(input);
  }

  private async optimizePlan(input: SolverAgentInput): Promise<any> {
    // Führt Optimierung mit zusätzlichen Soft-Constraints durch
    const optimizedInput = {
      ...input,
      data: {
        ...input.data,
        constraints: {
          ...input.data.constraints,
          optimization_target: 'cost', // oder 'time', 'satisfaction'
        }
      }
    };
    
    return await this.validateConstraints(optimizedInput);
  }

  private async generateProblemFormulation(data: any): Promise<any> {
    // Create a reliable constraint formulation based on travel planning patterns
    const budget = data.budget || 1000;
    const duration = data.duration || 3;
    const numHotels = data.hotels?.length || 0;
    const numAttractions = data.attractions?.length || 0;
    
    // Calculate realistic cost estimates
    const avgHotelCost = numHotels > 0 ? 
      data.hotels.reduce((sum: number, h: any) => sum + (h.price_per_night || 100), 0) / numHotels : 100;
    const minAccommodationCost = avgHotelCost * duration * 0.8;
    const maxAccommodationCost = avgHotelCost * duration * 1.5;
    
    return {
      variables: [
        {
          name: "total_cost",
          type: "real",
          domain: { min: 0, max: budget * 1.2 }
        },
        {
          name: "accommodation_cost", 
          type: "real",
          domain: { min: minAccommodationCost, max: maxAccommodationCost }
        },
        {
          name: "activity_cost",
          type: "real", 
          domain: { min: 0, max: 300 }
        },
        {
          name: "food_cost",
          type: "real",
          domain: { min: duration * 20, max: duration * 80 }
        },
        {
          name: "days_planned",
          type: "int",
          domain: { min: 1, max: duration }
        },
        {
          name: "activities_per_day",
          type: "int", 
          domain: { min: 1, max: 4 }
        }
      ],
      hard_constraints: [
        {
          name: "budget_limit",
          expression: "total_cost <= " + budget,
          description: "Total cost must not exceed budget"
        },
        {
          name: "cost_composition", 
          expression: "total_cost == accommodation_cost + activity_cost + food_cost",
          description: "Total cost equals sum of all components"
        },
        {
          name: "minimum_duration",
          expression: "days_planned >= 1",
          description: "Must plan at least one day"
        },
        {
          name: "activity_capacity",
          expression: "activities_per_day * days_planned <= " + Math.max(numAttractions, 10),
          description: "Cannot plan more activities than available"
        }
      ],
      soft_constraints: [
        {
          name: "budget_efficiency",
          expression: "total_cost >= " + (budget * 0.7),
          priority: 5,
          description: "Use at least 70% of budget for good experience"
        },
        {
          name: "activity_variety",
          expression: "activities_per_day >= 2", 
          priority: 7,
          description: "Prefer multiple activities per day"
        }
      ],
      optimization_targets: ["minimize_cost", "maximize_satisfaction"],
      metadata: {
        destination: data.destination,
        generated_at: new Date().toISOString(),
        input_budget: budget,
        estimated_hotel_cost: avgHotelCost
      }
    };
  }

  private generateSolverCode(formulation: any): string {
    const { variables, hard_constraints, soft_constraints } = formulation;

    let code = `
from z3 import *
import json

solver = Solver()
variables = {}

# Variablen definieren
`;

    // Variablen hinzufügen
    for (const variable of variables || []) {
      const { name, type, domain } = variable;
      if (type === 'int') {
        code += `variables['${name}'] = Int('${name}')\n`;
        if (domain?.min !== undefined) {
          code += `solver.add(variables['${name}'] >= ${domain.min})\n`;
        }
        if (domain?.max !== undefined) {
          code += `solver.add(variables['${name}'] <= ${domain.max})\n`;
        }
      } else if (type === 'real') {
        code += `variables['${name}'] = Real('${name}')\n`;
        if (domain?.min !== undefined) {
          code += `solver.add(variables['${name}'] >= ${domain.min})\n`;
        }
        if (domain?.max !== undefined) {
          code += `solver.add(variables['${name}'] <= ${domain.max})\n`;
        }
      } else if (type === 'bool') {
        code += `variables['${name}'] = Bool('${name}')\n`;
      }
    }

    code += `
# Hard Constraints
`;
    for (const constraint of hard_constraints || []) {
      code += `solver.add(${constraint.expression.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (match: string) => `variables['${match}']`)})\n`;
    }

    code += `
# Soft Constraints mit Tracking
`;
    for (const constraint of soft_constraints || []) {
      code += `solver.assert_and_track(${constraint.expression.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (match: string) => `variables['${match}']`)}, '${constraint.name}')\n`;
    }

    code += `
# Solver ausführen
result = solver.check()
if result == sat:
    model = solver.model()
    solution = {}
    for name, var in variables.items():
        try:
            value = model[var]
            if value is not None:
                solution[name] = str(value)
        except:
            solution[name] = None
    print(json.dumps({'status': 'satisfiable', 'solution': solution}))
elif result == unsat:
    core = solver.unsat_core()
    print(json.dumps({'status': 'unsatisfiable', 'unsat_core': [str(c) for c in core]}))
else:
    print(json.dumps({'status': 'timeout'}))
`;

    return code;
  }

  private async executeSolver(formulation: any): Promise<SolverResponse> {
    return new Promise((resolve) => {
      const solverPath = path.join(process.cwd(), 'server/solver/smt-solver.py');
      const problemJson = JSON.stringify({
        ...formulation,
        timeout: 30000 // 30 Sekunden Timeout
      });

      const pythonProcess = spawn('python3', [solverPath, problemJson], {
        cwd: process.cwd(),
        env: { ...process.env, PYTHONPATH: process.cwd() + '/.pythonlibs' }
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && output.trim()) {
          try {
            const result = JSON.parse(output.trim());
            resolve({
              success: true,
              status: result.status as any,
              solution: result.solution,
              unsatCore: result.unsat_core,
              executionTime: result.execution_time
            });
          } catch (error) {
            resolve({
              success: false,
              status: 'error',
              error: `Failed to parse solver output: ${error}`
            });
          }
        } else {
          resolve({
            success: false,
            status: 'error',
            error: `Solver execution failed: ${errorOutput || 'Unknown error'}`
          });
        }
      });

      // Timeout nach 35 Sekunden
      setTimeout(() => {
        pythonProcess.kill();
        resolve({
          success: false,
          status: 'timeout',
          error: 'Solver execution timed out'
        });
      }, 35000);
    });
  }

  private async generateImprovementSuggestions(
    data: any,
    unsatCore: string[],
    language: string
  ): Promise<string[]> {
    const prompt = `Du bist ein Reiseplanungsexperte. Das SMT-Solver-System hat festgestellt, dass die folgenden Constraints nicht gleichzeitig erfüllt werden können:

Konfliktierende Constraints: ${unsatCore.join(', ')}

Originale Anfrage:
- Ziel: ${data.destination}
- Budget: ${data.budget ? `${data.budget} ${data.currency || 'EUR'}` : 'Nicht angegeben'}
- Dauer: ${data.duration || 'Nicht angegeben'} Tage
- Präferenzen: ${data.preferences.join(', ')}

Analysiere die Konflikte und gib 3-5 konkrete, umsetzbare Verbesserungsvorschläge, die der Benutzer machen kann, um eine gültige Reiseplanung zu erhalten.

Antworte als JSON-Array mit klaren, freundlichen Vorschlägen:
["Vorschlag 1", "Vorschlag 2", "Vorschlag 3"]`;

    const response = await getChatCompletion([
      { 
        id: 0,
        chatId: 0,
        role: 'user', 
        content: prompt,
        metadata: null,
        createdAt: new Date()
      }
    ], language);

    try {
      return JSON.parse(response);
    } catch (error) {
      return [
        "Erhöhen Sie Ihr Budget um 20-30%",
        "Reduzieren Sie die Anzahl der geplanten Aktivitäten",
        "Wählen Sie ein kostengünstigeres Reiseziel",
        "Verlängern Sie Ihre Reisedauer um 1-2 Tage"
      ];
    }
  }
}