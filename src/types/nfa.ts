export const EPSILON = "ε";

export interface NFA {
  states: string[];
  alphabet: string[];
  startState: string;
  finalStates: string[];
  transitions: Record<string, Record<string, string[]>>;
}