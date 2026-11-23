import type { DFA } from "./nfaToDfa";

export interface DFASimulationStep {
  symbol: string;
  fromState: string;
  toState: string;
}

export interface DFASimulationResult {
  accepted: boolean;
  finalState: string;
  steps: DFASimulationStep[];
}

export function simulateDFA(dfa: DFA, input: string): DFASimulationResult {
  let state = dfa.startState;
  const steps: DFASimulationStep[] = [];
  for (const symbol of input) {
    if (!dfa.alphabet.includes(symbol)) {
      throw new Error(`Input symbol "${symbol}" is not in the alphabet.`);
    }
    const next = dfa.transitions[state]?.[symbol];
    if (next === undefined) {
      throw new Error(`Missing DFA transition from ${state} on ${symbol}.`);
    }
    steps.push({ symbol, fromState: state, toState: next });
    state = next;
  }
  return { accepted: dfa.finalStates.includes(state), finalState: state, steps };
}

export function invalidInputSymbols(input: string, alphabet: string[]): string[] {
  return [...new Set([...input].filter((symbol) => !alphabet.includes(symbol)))];
}
