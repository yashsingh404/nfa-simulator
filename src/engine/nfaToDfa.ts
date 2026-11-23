import type { NFA } from "../types/nfa";
import { EPSILON } from "../types/nfa";

export interface ConversionStep {
  stepNumber: number;
  fromState: string;
  fromStates: string[];
  symbol: string;
  movedStates: string[];
  closureStates: string[];
  toState: string;
  isNewState: boolean;
}

export interface DFA {
  states: string[];
  alphabet: string[];
  startState: string;
  finalStates: string[];
  transitions: Record<string, Record<string, string>>;
  conversionSteps: ConversionStep[];
  stateSubsets: Record<string, string[]>;
}

function epsilonClosure(
  nfa: NFA,
  states: Set<string>
): Set<string> {
  const closure = new Set(states);
  const stack = [...states];

  while (stack.length > 0) {
    const state = stack.pop()!;
    const epsilonTransitions =
      nfa.transitions[state]?.[EPSILON] ?? [];

    for (const next of epsilonTransitions) {
      if (!closure.has(next)) {
        closure.add(next);
        stack.push(next);
      }
    }
  }

  return closure;
}

function move(
  nfa: NFA,
  states: Set<string>,
  symbol: string
): Set<string> {
  const result = new Set<string>();

  for (const state of states) {
    const destinations =
      nfa.transitions[state]?.[symbol] ?? [];

    for (const destination of destinations) {
      result.add(destination);
    }
  }

  return result;
}

function stateName(states: Set<string>): string {
  if (states.size === 0) {
    return "∅";
  }

  return [...states].sort().join(",");
}

export function convertNfaToDfa(nfa: NFA): DFA {
  // Step 1: Calculate the epsilon closure of the start state.
  const startClosure = epsilonClosure(
    nfa,
    new Set([nfa.startState])
  );

  const startName = stateName(startClosure);

  const queue: Set<string>[] = [startClosure];

  const processed = new Set<string>();
  const dfaStates = new Set<string>([startName]);

  const dfaTransitions: Record<
    string,
    Record<string, string>
  > = {};

  const conversionSteps: ConversionStep[] = [];

  const stateSubsets: Record<string, string[]> = {
    [startName]: [...startClosure].sort(),
  };

  // Step 2: Process every discovered DFA state.
  while (queue.length > 0) {
    const currentSet = queue.shift()!;
    const currentName = stateName(currentSet);

    if (processed.has(currentName)) {
      continue;
    }

    processed.add(currentName);
    dfaTransitions[currentName] = {};

    // Step 3: Process every alphabet symbol.
    for (const symbol of nfa.alphabet) {
      // Calculate move(currentSet, symbol).
      const moved = move(nfa, currentSet, symbol);

      // Calculate epsilon closure of the moved states.
      const destination = epsilonClosure(nfa, moved);

      const destinationName = stateName(destination);

      dfaTransitions[currentName][symbol] =
        destinationName;

      // Check whether this is a newly discovered DFA state.
      const isNewState = !dfaStates.has(destinationName);

      if (isNewState) {
        dfaStates.add(destinationName);

        stateSubsets[destinationName] =
          [...destination].sort();

        queue.push(destination);
      }

      // Save the intermediate calculation for the UI.
      conversionSteps.push({
        stepNumber: conversionSteps.length + 1,
        fromState: currentName,
        fromStates: [...currentSet].sort(),
        symbol,
        movedStates: [...moved].sort(),
        closureStates: [...destination].sort(),
        toState: destinationName,
        isNewState,
      });
    }
  }

  // Step 4: Identify final DFA states.
  const dfaFinalStates = [...dfaStates].filter(
    (dfaState) => {
      const containedStates = stateSubsets[dfaState] ?? [];

      return containedStates.some((state) =>
        nfa.finalStates.includes(state)
      );
    }
  );

  return {
    states: [...dfaStates],
    alphabet: [...nfa.alphabet],
    startState: startName,
    finalStates: dfaFinalStates,
    transitions: dfaTransitions,
    conversionSteps,
    stateSubsets,
  };
}