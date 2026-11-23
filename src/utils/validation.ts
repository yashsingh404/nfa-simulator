import type { NFA } from "../types/nfa";
import { EPSILON } from "../types/nfa";

export function validateNFA(nfa: NFA): string[] {
  const errors: string[] = [];
  const unique = (items: string[]) => new Set(items).size === items.length;
  if (!nfa.states.length) errors.push("At least one state is required.");
  if (!unique(nfa.states)) errors.push("State names must be unique.");
  if (nfa.states.some((s) => !s.trim() || s === "∅" || s.includes(","))) {
    errors.push('State names cannot be empty, "∅", or contain commas.');
  }
  if (!nfa.alphabet.length) errors.push("At least one alphabet symbol is required.");
  if (!unique(nfa.alphabet)) errors.push("Alphabet symbols must be unique.");
  if (nfa.alphabet.some((s) => [...s].length !== 1 || s === EPSILON)) {
    errors.push("Use single-character alphabet symbols; ε is reserved for epsilon transitions.");
  }
  if (!nfa.states.includes(nfa.startState)) errors.push("Start state must exist in the states.");
  for (const state of nfa.finalStates) {
    if (!nfa.states.includes(state)) errors.push(`Final state "${state}" does not exist.`);
  }
  for (const [from, symbols] of Object.entries(nfa.transitions)) {
    if (!nfa.states.includes(from)) errors.push(`Transition source "${from}" does not exist.`);
    for (const [symbol, destinations] of Object.entries(symbols)) {
      if (symbol !== EPSILON && !nfa.alphabet.includes(symbol)) {
        errors.push(`Symbol "${symbol}" is not in the alphabet.`);
      }
      if (!destinations.length) errors.push(`Transition (${from}, ${symbol}) has no destination. Select a TO state or remove this row.`);
      for (const destination of destinations) {
        if (!nfa.states.includes(destination)) errors.push(`Transition destination "${destination}" does not exist.`);
      }
    }
  }
  return [...new Set(errors)];
}
