import type { NFA } from "../types/nfa";
import { simulateNFA } from "./simulator";

const nfa: NFA = {
  states: ["q0", "q1", "q2"],
  alphabet: ["0", "1"],

  startState: "q0",

  finalStates: ["q2"],

  transitions: {
    q0: {
      "0": ["q0", "q1"],
      "1": ["q0"],
    },

    q1: {
      "1": ["q2"],
    },

    q2: {},
  },
};

const result = simulateNFA(nfa, "001");

console.log(result);