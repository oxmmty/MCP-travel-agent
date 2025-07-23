#!/usr/bin/env python3
"""
SMT-Solver für Reiseplanung mit Z3
Überprüft die Erfüllbarkeit von Reiseplanungs-Constraints
"""

import json
import sys
from z3 import *
from typing import Dict, List, Any, Optional, Tuple
import time

class TravelPlanSolver:
    def __init__(self):
        self.solver = Solver()
        self.variables = {}
        self.constraints = []
        self.constraint_names = {}
        
    def add_variable(self, name: str, var_type: str, domain=None):
        """Fügt eine Variable zum Solver hinzu"""
        if var_type == "int":
            if domain:
                self.variables[name] = Int(name)
                if "min" in domain:
                    self.solver.add(self.variables[name] >= domain["min"])
                if "max" in domain:
                    self.solver.add(self.variables[name] <= domain["max"])
            else:
                self.variables[name] = Int(name)
        elif var_type == "bool":
            self.variables[name] = Bool(name)
        elif var_type == "real":
            if domain:
                self.variables[name] = Real(name)
                if "min" in domain:
                    self.solver.add(self.variables[name] >= domain["min"])
                if "max" in domain:
                    self.solver.add(self.variables[name] <= domain["max"])
            else:
                self.variables[name] = Real(name)
        
    def add_constraint(self, constraint_expr, name: str, is_hard: bool = True):
        """Fügt einen Constraint hinzu"""
        if is_hard:
            self.solver.add(constraint_expr)
        else:
            # Soft constraints mit assert_and_track für unsat core
            self.solver.assert_and_track(constraint_expr, name)
        
        self.constraints.append({
            'name': name,
            'expression': str(constraint_expr),
            'is_hard': is_hard
        })
        self.constraint_names[name] = constraint_expr
    
    def solve_travel_plan(self, problem_data: Dict) -> Dict:
        """Löst das Reiseplanungsproblem"""
        start_time = time.time()
        
        try:
            # Problem formalisieren
            self._formalize_problem(problem_data)
            
            # Solver ausführen
            result = self.solver.check()
            execution_time = int((time.time() - start_time) * 1000)
            
            if result == sat:
                model = self.solver.model()
                solution = self._extract_solution(model)
                return {
                    'status': 'satisfiable',
                    'solution': solution,
                    'execution_time': execution_time,
                    'constraints_count': len(self.constraints)
                }
            elif result == unsat:
                unsat_core = self._get_unsat_core()
                return {
                    'status': 'unsatisfiable',
                    'unsat_core': unsat_core,
                    'execution_time': execution_time,
                    'constraints_count': len(self.constraints)
                }
            else:
                return {
                    'status': 'timeout',
                    'execution_time': execution_time
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'execution_time': int((time.time() - start_time) * 1000)
            }
    
    def _formalize_problem(self, data: Dict):
        """Formalisiert das Reiseplanungsproblem als SMT-Problem"""
        
        # Zeitvariablen
        if data.get('start_date') and data.get('end_date'):
            self.add_variable('start_day', 'int', {'min': 0, 'max': 365})
            self.add_variable('end_day', 'int', {'min': 0, 'max': 365})
            self.add_constraint(
                self.variables['end_day'] > self.variables['start_day'],
                'valid_date_range'
            )
        
        # Budget-Constraints
        if data.get('budget'):
            budget_limit = data['budget']
            self.add_variable('total_cost', 'real', {'min': 0})
            
            # Accommodation costs
            if data.get('hotels'):
                self.add_variable('accommodation_cost', 'real', {'min': 0})
                hotel_costs = [hotel.get('price_per_night', 100) for hotel in data['hotels']]
                min_hotel_cost = min(hotel_costs) if hotel_costs else 50
                max_hotel_cost = max(hotel_costs) if hotel_costs else 300
                
                duration = data.get('duration', 3)
                self.add_constraint(
                    And(
                        self.variables['accommodation_cost'] >= min_hotel_cost * duration,
                        self.variables['accommodation_cost'] <= max_hotel_cost * duration
                    ),
                    'accommodation_cost_range'
                )
            
            # Activity costs
            if data.get('attractions'):
                self.add_variable('activity_cost', 'real', {'min': 0})
                avg_activity_cost = 25  # Durchschnittliche Kosten pro Aktivität
                num_activities = min(len(data['attractions']), data.get('duration', 3) * 2)
                
                self.add_constraint(
                    self.variables['activity_cost'] <= avg_activity_cost * num_activities,
                    'activity_cost_estimate'
                )
            
            # Total budget constraint
            cost_components = []
            if 'accommodation_cost' in self.variables:
                cost_components.append(self.variables['accommodation_cost'])
            if 'activity_cost' in self.variables:
                cost_components.append(self.variables['activity_cost'])
            
            if cost_components:
                total_expr = sum(cost_components)
                self.add_variable('calculated_total', 'real')
                self.add_constraint(
                    self.variables['calculated_total'] == total_expr,
                    'total_cost_calculation'
                )
                self.add_constraint(
                    self.variables['calculated_total'] <= budget_limit,
                    'budget_limit',
                    is_hard=True
                )
        
        # Präferenz-Constraints
        preferences = data.get('preferences', [])
        if preferences:
            for i, pref in enumerate(preferences):
                pref_var = f'preference_{i}_{pref}'
                self.add_variable(pref_var, 'bool')
                
                # Präferenz-spezifische Logik
                if pref == 'culture' and data.get('attractions'):
                    cultural_attractions = [
                        a for a in data['attractions'] 
                        if 'museum' in a.get('category', '').lower() or 
                           'cultural' in a.get('category', '').lower()
                    ]
                    if cultural_attractions:
                        self.add_constraint(
                            self.variables[pref_var] == True,
                            f'culture_preference_satisfied'
                        )
                
                elif pref == 'budget' and data.get('budget'):
                    # Budget-bewusste Planung
                    self.add_constraint(
                        self.variables[pref_var] == True,
                        f'budget_preference_considered'
                    )
        
        # Simplified and more realistic constraints
        if data.get('hotels'):
            self.add_variable('hotel_selected', 'bool')
            self.add_constraint(
                self.variables['hotel_selected'] == True,
                'hotel_availability'
            )
        
        if data.get('attractions') and data.get('duration'):
            num_attractions = len(data['attractions'])
            duration = data.get('duration', 3)
            
            self.add_variable('activities_per_day', 'real', {'min': 0.5, 'max': 4.0})
            self.add_variable('total_activities_planned', 'real', {'min': 1.0})
            
            # More flexible activity planning
            self.add_constraint(
                self.variables['total_activities_planned'] <= self.variables['activities_per_day'] * duration,
                'activity_scheduling_upper'
            )
            
            # Don't require using all attractions
            self.add_constraint(
                self.variables['total_activities_planned'] <= num_attractions,
                'activity_availability'
            )
            
            # Ensure at least some activities
            self.add_constraint(
                self.variables['total_activities_planned'] >= duration * 0.5,
                'minimum_activities'
            )
    
    def _extract_solution(self, model) -> Dict:
        """Extrahiert die Lösung aus dem Z3-Modell"""
        solution = {}
        
        for var_name, var in self.variables.items():
            try:
                value = model[var]
                if value is not None:
                    if is_int(var):
                        solution[var_name] = value.as_long()
                    elif is_real(var):
                        solution[var_name] = float(value.as_decimal(10))
                    elif is_bool(var):
                        solution[var_name] = is_true(value)
                    else:
                        solution[var_name] = str(value)
            except:
                solution[var_name] = None
        
        return solution
    
    def _get_unsat_core(self) -> List[str]:
        """Ermittelt den unsat core für unerfüllbare Probleme"""
        try:
            core = self.solver.unsat_core()
            return [str(c) for c in core]
        except:
            return []

def main():
    """Hauptfunktion für Kommandozeilen-Ausführung"""
    if len(sys.argv) != 2:
        print(json.dumps({'status': 'error', 'error': 'Usage: python smt-solver.py <problem_json>'}))
        sys.exit(1)
    
    try:
        problem_data = json.loads(sys.argv[1])
        solver = TravelPlanSolver()
        result = solver.solve_travel_plan(problem_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'status': 'error', 'error': str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()