#!/usr/bin/env python3
"""
Test script for the SMT-Solver with realistic travel scenarios
"""

import json
import subprocess
import sys

def run_solver_test(test_name, test_data):
    """Run a single solver test and return the result"""
    print(f"\n=== {test_name} ===")
    print(f"Input: {json.dumps(test_data, indent=2)}")
    
    try:
        result = subprocess.run([
            'python3', 'smt-solver.py', 
            json.dumps(test_data)
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            output = json.loads(result.stdout)
            print(f"Result: {output['status']}")
            if output.get('execution_time'):
                print(f"Execution time: {output['execution_time']}ms")
            if output.get('constraints_count'):
                print(f"Constraints: {output['constraints_count']}")
            if output.get('unsat_core'):
                print(f"Unsat core: {output['unsat_core']}")
            return output
        else:
            print(f"Error: {result.stderr}")
            return None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def main():
    """Run comprehensive solver tests"""
    
    # Test 1: Realistic satisfiable scenario
    test1 = {
        "destination": "Munich",
        "budget": 800,
        "duration": 3,
        "preferences": ["culture"],
        "hotels": [{"price_per_night": 90}],
        "attractions": [{"name": "Marienplatz"}]
    }
    
    # Test 2: Budget too low (should be unsatisfiable)
    test2 = {
        "destination": "Zurich", 
        "budget": 200,
        "duration": 5,
        "preferences": ["luxury"],
        "hotels": [{"price_per_night": 300}],
        "attractions": [{"name": "Lake Zurich"}]
    }
    
    # Test 3: Minimal viable trip
    test3 = {
        "destination": "Berlin",
        "budget": 300,
        "duration": 2,
        "preferences": ["budget"],
        "hotels": [{"price_per_night": 60}],
        "attractions": [{"name": "Brandenburg Gate"}]
    }
    
    # Test 4: Complex scenario with multiple constraints
    test4 = {
        "destination": "Vienna",
        "budget": 1200,
        "duration": 4,
        "preferences": ["culture", "dining"],
        "hotels": [
            {"price_per_night": 120},
            {"price_per_night": 180},
            {"price_per_night": 250}
        ],
        "attractions": [
            {"name": "Schönbrunn Palace"},
            {"name": "Belvedere Palace"},
            {"name": "St. Stephen's Cathedral"}
        ]
    }
    
    tests = [
        ("Realistic Munich Trip", test1),
        ("Expensive Zurich (Budget Constraint)", test2), 
        ("Minimal Berlin Trip", test3),
        ("Complex Vienna Trip", test4)
    ]
    
    results = []
    for name, data in tests:
        result = run_solver_test(name, data)
        results.append((name, result))
    
    print("\n" + "="*50)
    print("SUMMARY OF ALL TESTS")
    print("="*50)
    
    for name, result in results:
        if result:
            status = result.get('status', 'unknown')
            time_ms = result.get('execution_time', 'N/A')
            print(f"{name}: {status} ({time_ms}ms)")
        else:
            print(f"{name}: FAILED")

if __name__ == "__main__":
    main()