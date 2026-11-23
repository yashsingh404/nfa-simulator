import type { NFA } from "../types/nfa";
import { EPSILON } from "../types/nfa";

export interface SimulationStep {
  symbol: string;
  currentStates: string[];
}

export interface SimulationResult {
  accepted: boolean;
  steps: SimulationStep[];
  finalStates: string[];
}

function epsilonClosure(
  nfa: NFA,
  states: Set<string>
): Set<string> {
  const closure = new Set(states);
  const stack = [...states];

  while (stack.length > 0) {
    const state = stack.pop()!;

    const epsilonStates =
      nfa.transitions[state]?.[EPSILON] ?? [];

    for (const nextState of epsilonStates) {
      if (!closure.has(nextState)) {
        closure.add(nextState);
        stack.push(nextState);
      }
    }
  }

  return closure;
}

export function simulateNFA(
  nfa: NFA,
  input: string
): SimulationResult {
  let currentStates = epsilonClosure(
    nfa,
    new Set([nfa.startState])
  );

  const steps: SimulationStep[] = [];

  for (const symbol of input) {
    const nextStates = new Set<string>();

    for (const state of currentStates) {
      const destinations =
        nfa.transitions[state]?.[symbol] ?? [];

      for (const destination of destinations) {
        nextStates.add(destination);
      }
    }

    currentStates = epsilonClosure(
      nfa,
      nextStates
    );

    steps.push({
      symbol,
      currentStates: [...currentStates],
    });
  }

  const accepted = nfa.finalStates.some((state) =>
    currentStates.has(state)
  );

  return {
    accepted,
    steps,
    finalStates: [...currentStates],
  };
}