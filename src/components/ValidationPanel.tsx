import { useMemo, useState } from "react";
import type { NFA } from "../types/nfa";
import { convertNfaToDfa } from "../engine/nfaToDfa";
import { simulateNFA } from "../engine/simulator";
import { simulateDFA, invalidInputSymbols } from "../engine/dfaSimulator";

type Props = { nfa: NFA; errors: string[] };

export default function ValidationPanel({ nfa, errors }: Props) {
  const [input, setInput] = useState("");
  const signature = JSON.stringify(nfa);
  // Always use the current editor values, even before clicking Generate / Update DFA.
  const currentDfa = useMemo(() => errors.length ? null : convertNfaToDfa(nfa), [signature, errors.length]);
  const invalid = invalidInputSymbols(input, nfa.alphabet);
  const nfaResult = currentDfa && invalid.length === 0 ? simulateNFA(nfa, input) : null;
  const dfaResult = currentDfa && invalid.length === 0 ? simulateDFA(currentDfa, input) : null;
  const display = (states: string[]) => states.length ? `{${states.join(", ")}}` : "∅";
  const displayDfa = (state: string) => state === "∅" ? "∅" : `{${state}}`;

  return (
    <section className="card comparison-card">
      <div className="section-header">
        <div>
          <h2>NFA / DFA Comparison</h2>
          <p>Compare both machines using the NFA currently configured above. Results update as you edit.</p>
        </div>
        <span className="mono-tag">LIVE COMPARISON</span>
      </div>
      <div className="comparison-input">
        <label htmlFor="comparison-string">INPUT STRING</label>
        <input id="comparison-string" className="simulation-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Type a string or leave blank for ε" />
        <small>Alphabet: {nfa.alphabet.join(", ") || "—"}. Leave blank for the empty string (ε).</small>
      </div>
      {errors.length > 0 ? (
        <p className="validation-notice">Fix the NFA configuration errors above to compare results.</p>
      ) : invalid.length > 0 ? (
        <p className="validation-notice">Invalid input symbol(s): {invalid.join(", ")}. Use only symbols from the alphabet.</p>
      ) : nfaResult && dfaResult && currentDfa ? (
        <>
          <div className="validation-results">
            <div className="validation-result">
              <span>01 / ORIGINAL NFA</span>
              <strong>{nfaResult.accepted ? "ACCEPTED" : "REJECTED"}</strong>
              <small>Final active states: {display(nfaResult.finalStates)}</small>
            </div>
            <div className="validation-result">
              <span>02 / EQUIVALENT DFA</span>
              <strong>{dfaResult.accepted ? "ACCEPTED" : "REJECTED"}</strong>
              <small>Final state: {displayDfa(dfaResult.finalState)}</small>
            </div>
          </div>
          <p className="comparison-match">
            {nfaResult.accepted === dfaResult.accepted ? "✓ Results match — both machines agree." : "✕ Mismatch detected — check the conversion algorithm."}
          </p>
          <div className="dfa-table-wrapper">
            <table className="dfa-table">
              <thead><tr><th>Step</th><th>Read</th><th>NFA active states</th><th>DFA state</th></tr></thead>
              <tbody>
                <tr><td>0</td><td>Start / ε-closure</td><td>{display(currentDfa.stateSubsets[currentDfa.startState] ?? [])}</td><td>{displayDfa(currentDfa.startState)}</td></tr>
                {dfaResult.steps.map((step, i) => (
                  <tr key={i}><td>{i + 1}</td><td>{step.symbol}</td><td>{display(nfaResult.steps[i]?.currentStates ?? [])}</td><td>{displayDfa(step.toState)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
