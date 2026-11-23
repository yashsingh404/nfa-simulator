import type { NFA } from "../types/nfa";
import type { DFA } from "./nfaToDfa";
import { convertNfaToDfa } from "./nfaToDfa";
import { simulateNFA } from "./simulator";
import { simulateDFA, invalidInputSymbols } from "./dfaSimulator";
import { validateNFA } from "../utils/validation";

export type Expected = "accept" | "reject";
export interface TestCase { id: number; input: string; expected: Expected | "unspecified"; }
export interface TestResult {
  input: string;
  expected: Expected | "unspecified";
  nfa: Expected | "error";
  dfa: Expected | "error";
  equivalent: boolean;
  expectedMatch: boolean | null;
  message: string;
}
const verdict = (accepted: boolean): Expected => accepted ? "accept" : "reject";

export function runTestCases(nfa: NFA, dfa: DFA, tests: TestCase[]): TestResult[] {
  return tests.map(({ input, expected }) => {
    const invalid = invalidInputSymbols(input, nfa.alphabet);
    if (invalid.length) return { input, expected, nfa: "error", dfa: "error", equivalent: false, expectedMatch: false, message: `Invalid symbols: ${invalid.join(", ")}` };
    try {
      const nfaResult = verdict(simulateNFA(nfa, input).accepted);
      const dfaResult = verdict(simulateDFA(dfa, input).accepted);
      const equivalent = nfaResult === dfaResult;
      return { input, expected, nfa: nfaResult, dfa: dfaResult, equivalent,
        expectedMatch: expected === "unspecified" ? null : expected === nfaResult && expected === dfaResult,
        message: equivalent ? "Results match" : "NFA/DFA mismatch" };
    } catch (error) {
      return { input, expected, nfa: "error", dfa: "error", equivalent: false, expectedMatch: false,
        message: error instanceof Error ? error.message : "Simulation error" };
    }
  });
}

// Fixed oracle cases for epsilon closure, epsilon cycles, empty input,
// nondeterministic branches, trap states, and invalid definitions.
export function runBuiltInTests(): { name: string; passed: boolean; detail: string }[] {
  const epsilonNfa: NFA = {
    states: ["q0", "q1", "q2"], alphabet: ["a", "b"], startState: "q0", finalStates: ["q2"],
    transitions: { q0: { "ε": ["q1"] }, q1: { a: ["q1"], b: ["q2"] }, q2: { a: ["q2"], b: ["q2"] } },
  };
  const cycleNfa: NFA = {
    states: ["q0", "q1"], alphabet: ["a"], startState: "q0", finalStates: ["q1"],
    transitions: { q0: { "ε": ["q1"] }, q1: { "ε": ["q0"], a: ["q1"] } },
  };
  const branchNfa: NFA = {
    states: ["q0", "q1", "q2"], alphabet: ["0", "1"], startState: "q0", finalStates: ["q2"],
    transitions: { q0: { "0": ["q0", "q1"] }, q1: { "1": ["q2"] } },
  };
  const cases: { name: string; nfa: NFA; input: string; expected: boolean }[] = [
    { name: "ε-closure accepts ab", nfa: epsilonNfa, input: "ab", expected: true },
    { name: "ε-closure rejects a", nfa: epsilonNfa, input: "a", expected: false },
    { name: "ε-NFA rejects empty input", nfa: epsilonNfa, input: "", expected: false },
    { name: "ε-cycle terminates and accepts empty input", nfa: cycleNfa, input: "", expected: true },
    { name: "ε-cycle accepts a", nfa: cycleNfa, input: "a", expected: true },
    { name: "Nondeterministic branches accept 01", nfa: branchNfa, input: "01", expected: true },
    { name: "Missing transition leads to trap/reject", nfa: branchNfa, input: "11", expected: false },
  ];
  const results = cases.map(({ name, nfa, input, expected }) => {
    try {
      const dfa = convertNfaToDfa(nfa);
      const actualNfa = simulateNFA(nfa, input).accepted;
      const actualDfa = simulateDFA(dfa, input).accepted;
      return { name, passed: actualNfa === expected && actualDfa === expected,
        detail: `Expected ${expected ? "Accept" : "Reject"}; NFA ${actualNfa ? "Accept" : "Reject"}; DFA ${actualDfa ? "Accept" : "Reject"}` };
    } catch (error) { return { name, passed: false, detail: String(error) }; }
  });
  const malformed: NFA = { ...epsilonNfa, transitions: { q0: { x: ["missing"] } } };
  results.push({ name: "Invalid transition symbols/destinations detected",
    passed: validateNFA(malformed).some((e) => e.includes('Symbol "x"')) && validateNFA(malformed).some((e) => e.includes('destination "missing"')),
    detail: "Expected validation errors for unknown symbol and state" });
  results.push({ name: "Invalid input symbol detected", passed: invalidInputSymbols("ac", ["a", "b"]).includes("c"), detail: "Expected invalid symbol c" });
  return results;
}
