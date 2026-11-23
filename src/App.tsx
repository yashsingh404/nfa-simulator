import { useEffect, useState } from "react";
import { simulateNFA } from "./engine/simulator";
import { convertNfaToDfa } from "./engine/nfaToDfa";
import type { DFA } from "./engine/nfaToDfa";
import { EPSILON } from "./types/nfa";
import type { NFA } from "./types/nfa";
import { validateNFA } from "./utils/validation";
import StateDiagram from "./components/StateDiagram";
import DFADiagram from "./components/DFADiagram";
import ValidationPanel from "./components/ValidationPanel";
import "./App.css";

type Transition = {
  from: string;
  symbol: string;
  to: string;
};

const defaultStates = ["q0", "q1", "q2"];

const defaultAlphabet = ["0", "1"];

const defaultStartState = "q0";

const defaultFinalStates = ["q2"];

const defaultTransitions: Transition[] = [
  {
    from: "q0",
    symbol: "0",
    to: "q0,q1",
  },
  {
    from: "q0",
    symbol: "1",
    to: "q0",
  },
  {
    from: "q1",
    symbol: "1",
    to: "q2",
  },
];

function App() {
  const [workspaceTab, setWorkspaceTab] = useState<"build" | "nfa" | "convert" | "compare">("build");
  const [states, setStates] =
    useState<string[]>(defaultStates);

  const [alphabet, setAlphabet] =
    useState<string[]>(defaultAlphabet);

  const [startState, setStartState] =
    useState(defaultStartState);

  const [finalStates, setFinalStates] =
    useState<string[]>(defaultFinalStates);

  const [transitions, setTransitions] =
    useState<Transition[]>(
      defaultTransitions
    );

  const [input, setInput] = useState("");

  const [currentStep, setCurrentStep] =
    useState(0);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [conversionStep, setConversionStep] = useState(0);
  const [conversionPlaying, setConversionPlaying] = useState(false);
  const [showAllConversionSteps, setShowAllConversionSteps] = useState(false);

  /*
   * Build NFA object
   */

  const nfa: NFA = {
    states,

    alphabet,

    startState,

    finalStates,

    transitions: transitions.reduce(
      (result, transition) => {
        if (
          !transition.from ||
          !transition.symbol
        ) {
          return result;
        }

        if (!result[transition.from]) {
          result[transition.from] = {};
        }

        // Merge multiple transition rows with the same source and symbol.
        const existing = result[transition.from][transition.symbol] ?? [];
        const selected = transition.to
          .split(",")
          .map((state) => state.trim())
          .filter(Boolean);

        result[transition.from][transition.symbol] = [
          ...new Set([...existing, ...selected]),
        ];

        return result;
      },

      {} as Record<
        string,
        Record<string, string[]>
      >
    ),
  };

  /*
   * Validation
   */

  const errors = validateNFA(nfa);

  /*
   * NFA simulation
   */

  const invalidSimulationInput = [...new Set([...input].filter((symbol) => !alphabet.includes(symbol)))];

  const result =
    errors.length === 0 && invalidSimulationInput.length === 0
      ? simulateNFA(nfa, input)
      : null;

  const totalSteps =
    result?.steps.length ?? 0;

  /*
   * DFA conversion
   */

  // Generate the DFA from the current NFA when requested.
  const [generatedDfa, setGeneratedDfa] = useState<DFA | null>(null);
  const [generatedSignature, setGeneratedSignature] = useState("");
  const [generationMessage, setGenerationMessage] = useState("");
  const nfaSignature = JSON.stringify({
    states, alphabet, startState, finalStates, transitions,
  });
  const dfa = generatedDfa;
  const dfaNeedsUpdate = generatedSignature !== nfaSignature;

  const generateDFA = () => {
    if (errors.length > 0) {
      setGenerationMessage("Fix the NFA validation errors above, then generate again.");
      return;
    }
    setGeneratedDfa(convertNfaToDfa(nfa));
    setGeneratedSignature(nfaSignature);
    setGenerationMessage("DFA generated from the current NFA.");
    setConversionStep(0);
    setConversionPlaying(false);
    setShowAllConversionSteps(false);
  };

  const conversionTotal = dfa?.conversionSteps.length ?? 0;
  const activeConversionStep =
    conversionStep > 0 ? dfa?.conversionSteps[conversionStep - 1] : undefined;

  useEffect(() => {
    if (!conversionPlaying) return;
    if (conversionStep >= conversionTotal) {
      setConversionPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setConversionStep((step) => Math.min(step + 1, conversionTotal));
    }, 1100);
    return () => clearTimeout(timer);
  }, [conversionPlaying, conversionStep, conversionTotal]);

  // Reset playback when the NFA definition changes.

  useEffect(() => {
    setConversionStep(0);
    setConversionPlaying(false);
    setShowAllConversionSteps(false);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [nfaSignature]);

  /*
   * Simulation playback
   */

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    if (currentStep >= totalSteps) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep(
        (step) => step + 1
      );
    }, 800);

    return () => clearTimeout(timer);
  }, [
    isPlaying,
    currentStep,
    totalSteps,
  ]);

  /*
   * Input
   */

  const handleInputChange = (
    value: string
  ) => {
    setInput(value);

    setCurrentStep(0);

    setIsPlaying(false);
  };

  /*
   * Add state
   */

  const addState = () => {
    let index = 0;

    let newState = `q${index}`;

    while (states.includes(newState)) {
      index++;

      newState = `q${index}`;
    }

    setStates([
      ...states,
      newState,
    ]);

    if (!startState) {
      setStartState(newState);
    }

    setCurrentStep(0);

    setIsPlaying(false);
  };

  /*
   * Remove state
   */

  const removeState = (
    stateToRemove: string
  ) => {
    if (states.length === 1) {
      return;
    }

    const newStates =
      states.filter(
        (state) =>
          state !== stateToRemove
      );

    setStates(newStates);

    /*
     * Fix start state
     */

    if (
      startState === stateToRemove
    ) {
      setStartState(
        newStates[0]
      );
    }

    /*
     * Remove from final states
     */

    setFinalStates(
      (current) =>
        current.filter(
          (state) =>
            state !== stateToRemove
        )
    );

    /*
     * Remove transitions
     * involving deleted state
     */

    setTransitions(
      (current) =>
        current
          .filter(
            (transition) =>
              transition.from !==
              stateToRemove
          )
          .map(
            (transition) => ({
              ...transition,

              to: transition.to
                .split(",")
                .map(
                  (state) =>
                    state.trim()
                )
                .filter(
                  (state) =>
                    state !==
                    stateToRemove
                )
                .join(","),
            })
          )
    );

    setCurrentStep(0);

    setIsPlaying(false);
  };

  /*
   * Update alphabet
   */

  const updateAlphabet = (
    value: string
  ) => {
    setAlphabet(
      value
        .split(",")
        .map(
          (symbol) =>
            symbol.trim()
        )
        .filter(Boolean)
        .filter(
          (symbol) =>
            symbol !== EPSILON
        )
    );

    setCurrentStep(0);

    setIsPlaying(false);
  };

  /*
   * Update final states
   */

  const updateFinalStates = (
    value: string
  ) => {
    setFinalStates(
      value
        .split(",")
        .map(
          (state) =>
            state.trim()
        )
        .filter(Boolean)
    );
  };

  /*
   * Toggle final state
   */

  const toggleFinalState = (
    state: string
  ) => {
    setFinalStates(
      (current) =>
        current.includes(state)
          ? current.filter(
              (item) =>
                item !== state
            )
          : [
              ...current,
              state,
            ]
    );

    setCurrentStep(0);

    setIsPlaying(false);
  };

  /*
   * Add transition
   */

  const addTransition = () => {
    setTransitions([
      ...transitions,

      {
        from:
          states[0] || "",

        symbol:
          alphabet[0] ||
          EPSILON,

        to: "",
      },
    ]);

    setCurrentStep(0);

    setIsPlaying(false);
  };

  /*
   * Update transition
   */

  const updateTransition = (
    index: number,
    field: keyof Transition,
    value: string
  ) => {
    const updated = [
      ...transitions,
    ];

    updated[index] = {
      ...updated[index],

      [field]: value,
    };

    setTransitions(updated);

    setCurrentStep(0);

    setIsPlaying(false);
  };

  /*
   * Remove transition
   */

  const removeTransition = (
    index: number
  ) => {
    setTransitions(
      transitions.filter(
        (_, i) =>
          i !== index
      )
    );

    setCurrentStep(0);

    setIsPlaying(false);
  };

  /*
   * Reset entire NFA
   */

  const resetNFA = () => {
    setStates(defaultStates);

    setAlphabet(
      defaultAlphabet
    );

    setStartState(
      defaultStartState
    );

    setFinalStates(
      defaultFinalStates
    );

    setTransitions(
      defaultTransitions
    );

    setInput("");

    setCurrentStep(0);

    setIsPlaying(false);

    setConversionStep(0);
    setConversionPlaying(false);
    setShowAllConversionSteps(false);
    setGeneratedDfa(null);
    setGeneratedSignature("");
    setGenerationMessage("");
  };

  /*
   * Reset simulation only
   */

  const resetSimulation = () => {
    setCurrentStep(0);

    setIsPlaying(false);
  };

  /*
   * Active states
   */

  const activeStates =
    result && currentStep > 0
      ? result.steps[
          currentStep - 1
        ]?.currentStates || []
      : [startState];

  /*
   * Current symbol
   */

  const currentSymbol =
    result && currentStep > 0
      ? result.steps[
          currentStep - 1
        ]?.symbol
      : null;

  /*
   * Simulation status
   */

  const simulationFinished =
    currentStep === totalSteps &&
    totalSteps > 0;

  const simulationAccepted =
    simulationFinished &&
    result?.accepted === true;

  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">

        <div>
          <h1>
            NFA Simulator
          </h1>

          <p>
            Build, visualize and
            simulate a
            Non-Deterministic
            Finite Automaton
          </p>
        </div>

        <button
          className="reset-button"
          onClick={resetNFA}
        >
          ↻ Reset NFA
        </button>

      </header>

      <nav className="workspace-tabs" aria-label="Simulator workspace">
        {([ ["build", "01", "Build NFA"], ["nfa", "02", "NFA Explorer"], ["convert", "03", "DFA Conversion"], ["compare", "04", "Compare" ] ] as const).map(([tab, number, label]) => (
          <button key={tab} type="button" className={workspaceTab === tab ? "workspace-tab selected" : "workspace-tab"} onClick={() => setWorkspaceTab(tab)} aria-current={workspaceTab === tab ? "page" : undefined}>
            <span className="workspace-tab-number">{number}</span>{label}
          </button>
        ))}
      </nav>
      <main className="workspace-main">

        {/* VALIDATION */}

        {errors.length > 0 && (
          <section className="card validation-error">

            <h2>
              ⚠ Validation Errors
            </h2>

            <div className="error-list">

              {errors.map(
                (
                  error,
                  index
                ) => (
                  <p
                    key={index}
                  >
                    • {error}
                  </p>
                )
              )}

            </div>

          </section>
        )}

        <div className={workspaceTab === "build" ? "workspace-view active-view" : "workspace-view"}>
        {/* NFA CONFIGURATION */}

        <section className="card">

          <div className="card-title">

            <h2>
              NFA Configuration
            </h2>

            <p>
              Define the components
              of your automaton.
            </p>

          </div>

          <div className="form-grid">

            {/* STATES */}

            <div className="field">

              <div className="field-label-row">

                <label>
                  States
                </label>

                <button
                  type="button"
                  className="small-add-button"
                  onClick={
                    addState
                  }
                >
                  + Add State
                </button>

              </div>

              <div className="state-list">

                {states.map(
                  (state) => (
                    <div
                      className="state-chip"
                      key={state}
                    >

                      <span>
                        {state}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeState(
                            state
                          )
                        }
                      >
                        ×
                      </button>

                    </div>
                  )
                )}

              </div>

              <small>
                Add or remove states
                dynamically.
              </small>

            </div>

            {/* ALPHABET */}

            <div className="field">

              <label>
                Alphabet
              </label>

              <input
                value={alphabet.join(
                  ", "
                )}
                onChange={(e) =>
                  updateAlphabet(
                    e.target.value
                  )
                }
                placeholder="0, 1"
              />

              <small>
                ε is reserved for
                epsilon transitions.
              </small>

            </div>

            {/* START STATE */}

            <div className="field">

              <label>
                Start State
              </label>

              <select
                value={startState}
                onChange={(e) => {
                  setStartState(
                    e.target.value
                  );

                  resetSimulation();
                }}
              >

                {states.length ===
                  0 && (
                    <option value="">
                      No states
                    </option>
                  )}

                {states.map(
                  (state) => (
                    <option
                      key={state}
                      value={state}
                    >
                      {state}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* FINAL STATES */}

            <div className="field">

              <label>
                Final States
              </label>

              <input
                value={finalStates.join(
                  ", "
                )}
                onChange={(e) =>
                  updateFinalStates(
                    e.target.value
                  )
                }
                placeholder="q2"
              />

              <small>
                Example: q1, q2
              </small>

            </div>

          </div>

          {/* FINAL STATE SELECTOR */}

          <div className="final-state-selector">

            <label>
              Select Final States
            </label>

            <div className="state-buttons">

              {states.map(
                (state) => (
                  <button
                    key={state}
                    className={
                      finalStates.includes(
                        state
                      )
                        ? "state-button active"
                        : "state-button"
                    }
                    onClick={() =>
                      toggleFinalState(
                        state
                      )
                    }
                  >
                    {state}
                  </button>
                )
              )}

            </div>

          </div>

        </section>

        {/* TRANSITIONS */}

        <section className="card">

          <div className="section-header">

            <div>

              <h2>
                Transitions
              </h2>

              <p>
                Define transitions.
                ε is supported.
              </p>

            </div>

            <button
              className="primary-button"
              onClick={
                addTransition
              }
            >
              + Add Transition
            </button>

          </div>

          <div className="transition-header">

            <span>
              FROM
            </span>

            <span>
              INPUT
            </span>

            <span>
              TO
            </span>

            <span></span>

          </div>

          {transitions.length ===
            0 && (
              <div className="empty-state">
                No transitions
                added.
              </div>
            )}

          {transitions.map(
            (
              transition,
              index
            ) => (

              <div
                className="transition-row"
                key={index}
              >

                <select
                  value={
                    transition.from
                  }
                  onChange={(e) =>
                    updateTransition(
                      index,
                      "from",
                      e.target.value
                    )
                  }
                >

                  {states.map(
                    (state) => (
                      <option
                        key={state}
                        value={state}
                      >
                        {state}
                      </option>
                    )
                  )}

                </select>

                <select
                  value={
                    transition.symbol
                  }
                  onChange={(e) =>
                    updateTransition(
                      index,
                      "symbol",
                      e.target.value
                    )
                  }
                >

                  {alphabet.map(
                    (symbol) => (
                      <option
                        key={symbol}
                        value={symbol}
                      >
                        {symbol}
                      </option>
                    )
                  )}

                  <option
                    value={EPSILON}
                  >
                    ε
                  </option>

                </select>

                <details className="destination-picker" key={`${index}-${states.join(",")}`}>
                  <summary className="destination-picker-summary">
                    {transition.to.trim()
                      ? transition.to.split(",").map((item) => item.trim()).filter(Boolean).join(", ")
                      : "Select destination states"}
                  </summary>
                  <div className="destination-picker-options">
                    {states.map((state) => {
                      const selected = transition.to
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean);
                      return (
                        <label key={state} className="destination-picker-option">
                          <input
                            type="checkbox"
                            checked={selected.includes(state)}
                            onChange={(event) => {
                              const next = event.target.checked
                                ? [...selected, state]
                                : selected.filter((item) => item !== state);
                              updateTransition(index, "to", [...new Set(next)].join(","));
                            }}
                          />
                          <span>{state}</span>
                        </label>
                      );
                    })}
                    <button
                      type="button"
                      className="destination-picker-clear"
                      onClick={() => updateTransition(index, "to", "")}
                    >
                      Clear selection
                    </button>
                  </div>
                </details>

                <button
                  className="delete-button"
                  onClick={() =>
                    removeTransition(
                      index
                    )
                  }
                >
                  ×
                </button>

              </div>

            )
          )}

        </section>

        </div>
        <div className={workspaceTab === "nfa" ? "workspace-view active-view" : "workspace-view"}>
        {/* NFA DIAGRAM */}

        <section className="card diagram-card">

          <div className="section-header">

            <div>

              <h2>
                NFA State Diagram
              </h2>

              <p>
                Current active states:{" "}
                {activeStates.length
                  ? activeStates.join(
                      ", "
                    )
                  : "∅"}
              </p>

            </div>

          </div>

          {errors.length ===
          0 ? (
            <StateDiagram
              states={states}
              startState={
                startState
              }
              finalStates={
                finalStates
              }
              transitions={
                nfa.transitions
              }
              activeStates={
                activeStates
              }
            />
          ) : (
            <div className="diagram-error">
              Fix validation
              errors to display
              the diagram.
            </div>
          )}

        </section>

        {/* SIMULATION */}

        <section className="card">

          <div className="section-header">

            <div>

              <h2>
                Simulation
              </h2>

              <p>
                Execute the NFA
                step-by-step.
              </p>

            </div>

          </div>

          <div className="input-area">

            <label>
              Input String
            </label>

            <input
              className="simulation-input"
              value={input}
              onChange={(e) =>
                handleInputChange(
                  e.target.value
                )
              }
              placeholder="Enter input string..."
            />

            <small>
              Example: 001
            </small>

          </div>

          {invalidSimulationInput.length > 0 && (
            <p className="validation-bad">Invalid input symbol(s): {invalidSimulationInput.join(", ")}. Use only symbols from the alphabet.</p>
          )}
          {input === "" && result && errors.length === 0 && (
            <div className={result.accepted ? "result accepted" : "result rejected"}>
              <strong>Empty string (ε): {result.accepted ? "ACCEPTED" : "REJECTED"}</strong>
            </div>
          )}

          {input &&
            result &&
            errors.length ===
              0 && (

              <div className="simulation-controls">

                <button
                  onClick={() => {
                    setCurrentStep(
                      (step) =>
                        Math.max(
                          0,
                          step - 1
                        )
                    );

                    setIsPlaying(
                      false
                    );
                  }}
                  disabled={
                    currentStep ===
                    0
                  }
                >
                  ← Previous
                </button>

                <button
                  className="play-button"
                  onClick={() => {

                    if (
                      currentStep >=
                      totalSteps
                    ) {
                      setCurrentStep(
                        0
                      );
                    }

                    setIsPlaying(
                      (playing) =>
                        !playing
                    );

                  }}
                >
                  {isPlaying
                    ? "Ⅱ Pause"
                    : "▶ Play"}
                </button>

                <button
                  onClick={() => {

                    setCurrentStep(
                      (step) =>
                        Math.min(
                          totalSteps,
                          step + 1
                        )
                    );

                    setIsPlaying(
                      false
                    );

                  }}
                  disabled={
                    currentStep >=
                    totalSteps
                  }
                >
                  Next →
                </button>

                <button
                  onClick={
                    resetSimulation
                  }
                >
                  ↺ Reset
                </button>

              </div>
            )}

          {input &&
            result &&
            errors.length ===
              0 && (

              <div className="progress-container">

                <div className="progress-info">

                  <span>
                    Step{" "}
                    {currentStep} /{" "}
                    {totalSteps}
                  </span>

                  {currentSymbol && (
                    <span>
                      Reading:{" "}
                      <strong>
                        {
                          currentSymbol
                        }
                      </strong>
                    </span>
                  )}

                </div>

                <div className="progress-bar">

                  <div
                    className="progress-fill"
                    style={{
                      width:
                        totalSteps ===
                        0
                          ? "0%"
                          : `${
                              (currentStep /
                                totalSteps) *
                              100
                            }%`,
                    }}
                  />

                </div>

              </div>
            )}

          {input &&
            result &&
            errors.length ===
              0 && (

              <div className="current-state-box">

                <span>
                  Current States
                </span>

                <code>
                  {`{${activeStates.join(
                    ", "
                  )}}`}
                </code>

              </div>
            )}

          {input &&
            result &&
            simulationFinished && (

              <div
                className={
                  simulationAccepted
                    ? "result accepted"
                    : "result rejected"
                }
              >

                <span className="result-icon">
                  {simulationAccepted
                    ? "✓"
                    : "✗"}
                </span>

                <div>

                  <strong>
                    {simulationAccepted
                      ? "ACCEPTED"
                      : "REJECTED"}
                  </strong>

                  <p>
                    Input:{" "}
                    <code>
                      {input}
                    </code>
                  </p>

                </div>

              </div>
            )}

        </section>

        </div>
        <div className={workspaceTab === "convert" ? "workspace-view active-view" : "workspace-view"}>
        {/* DFA CONVERSION */}

        <section className="card">

          <div className="section-header">

            <div>

              <h2>
                NFA → DFA
              </h2>

              <p>
                Convert the current
                NFA into an equivalent
                DFA.
              </p>

            </div>

            <button
              type="button"
              className="primary-button"
              onClick={generateDFA}
            >
              ↻ Generate / Update DFA
            </button>

          </div>

          {generationMessage && (
            <p className="dfa-generation-message">{generationMessage}</p>
          )}
          {dfaNeedsUpdate && dfa && (
            <p className="dfa-stale-warning">
              NFA changed. Click Generate / Update DFA to refresh the DFA below.
            </p>
          )}
          {dfa ? (

              <div className="dfa-section">

                {/* STEP-BY-STEP DFA CONVERSION */}

                <div className="dfa-block">
                  <h3>Step-by-Step NFA → DFA Conversion</h3>

                  <p className="conversion-description">
                    Each DFA state represents a set of NFA states.
                    For each input symbol, the algorithm calculates
                    move() followed by ε-closure().
                  </p>

                  <div className="conversion-start">
                    <strong>Initial DFA State:</strong>
                    <code>
                      {dfa.startState === "∅"
                        ? "∅"
                        : `{${dfa.startState}}`}
                    </code>
                    <span>
                      = ε-closure({`{${nfa.startState}}`})
                    </span>
                  </div>

                  <div className="conversion-playback">
                    <div className="conversion-playback-top">
                      <strong>Conversion step {conversionStep} / {conversionTotal}</strong>
                      <span>{conversionStep === 0 ? "Initial ε-closure" :
                        conversionStep === conversionTotal ? "Conversion complete" : "Processing transitions"}</span>
                    </div>
                    <div className="conversion-progress-track">
                      <div className="conversion-progress-fill" style={{
                        width: conversionTotal === 0 ? "100%" : `${(conversionStep / conversionTotal) * 100}%`
                      }} />
                    </div>
                    {activeConversionStep ? (
                      <div className="conversion-step-detail" aria-live="polite">
                        <span>From <b>{`{${activeConversionStep.fromStates.join(",")}}`}</b></span>
                        <span>Input <b>{activeConversionStep.symbol}</b></span>
                        <span>move() <b>{activeConversionStep.movedStates.length ? `{${activeConversionStep.movedStates.join(",")}}` : "∅"}</b></span>
                        <span>ε-closure() <b>{activeConversionStep.closureStates.length ? `{${activeConversionStep.closureStates.join(",")}}` : "∅"}</b></span>
                        <span>Destination <b>{activeConversionStep.toState === "∅" ? "∅" : `{${activeConversionStep.toState}}`}</b></span>
                        <span className={activeConversionStep.isNewState ? "conversion-new" : "conversion-existing"}>
                          {activeConversionStep.isNewState ? "New State" : "Existing"}
                        </span>
                      </div>
                    ) : (
                      <p className="conversion-initial-note">Start with ε-closure of the NFA start state, then press Next or Play.</p>
                    )}
                    <div className="conversion-controls">
                      <button type="button" disabled={conversionStep === 0}
                        onClick={() => { setConversionPlaying(false); setConversionStep((step) => Math.max(0, step - 1)); }}>
                        ← Previous
                      </button>
                      <button type="button" className="conversion-play-button" disabled={conversionTotal === 0}
                        onClick={() => {
                          if (conversionPlaying) { setConversionPlaying(false); return; }
                          if (conversionStep >= conversionTotal) setConversionStep(0);
                          setConversionPlaying(true);
                        }}>
                        {conversionPlaying ? "Ⅱ Pause" : "▶ Play"}
                      </button>
                      <button type="button" disabled={conversionStep >= conversionTotal}
                        onClick={() => { setConversionPlaying(false); setConversionStep((step) => Math.min(conversionTotal, step + 1)); }}>
                        Next →
                      </button>
                      <button type="button" onClick={() => { setConversionPlaying(false); setConversionStep(0); }}>
                        ↺ Reset
                      </button>
                      <button type="button" aria-pressed={showAllConversionSteps}
                        onClick={() => setShowAllConversionSteps((value) => !value)}>
                        {showAllConversionSteps ? "Show Current Only" : "Show All Steps"}
                      </button>
                    </div>
                  </div>

                  <div className="dfa-table-wrapper">
                    <table className="dfa-table">
                      <thead>
                        <tr>
                          <th>Step</th>
                          <th>Current State</th>
                          <th>Input</th>
                          <th>move()</th>
                          <th>ε-closure()</th>
                          <th>Destination</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dfa.conversionSteps
                          .filter((step) => showAllConversionSteps || step.stepNumber <= conversionStep)
                          .map((step) => (
                          <tr key={step.stepNumber} className={step.stepNumber === conversionStep ? "conversion-active-row" : ""}>
                            <td>{step.stepNumber}</td>
                            <td>
                              {step.fromStates.length
                                ? `{${step.fromStates.join(",")}}`
                                : "∅"}
                            </td>
                            <td>{step.symbol}</td>
                            <td>
                              {step.movedStates.length
                                ? `{${step.movedStates.join(",")}}`
                                : "∅"}
                            </td>
                            <td>
                              {step.closureStates.length
                                ? `{${step.closureStates.join(",")}}`
                                : "∅"}
                            </td>
                            <td>
                              {step.toState === "∅"
                                ? "∅"
                                : `{${step.toState}}`}
                            </td>
                            <td>
                              <span
                                className={
                                  step.isNewState
                                    ? "conversion-new"
                                    : "conversion-existing"
                                }
                              >
                                {step.isNewState
                                  ? "New State"
                                  : "Existing"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* DFA STATES */}

                <div className="dfa-block">

                  <h3>
                    DFA States
                  </h3>

                  <div className="dfa-state-list">

                    {dfa.states.map(
                      (state) => {

                        const isStart =
                          state ===
                          dfa.startState;

                        const isFinal =
                          dfa.finalStates.includes(
                            state
                          );

                        return (
                          <div
                            className={
                              isFinal
                                ? "dfa-state final"
                                : "dfa-state"
                            }
                            key={state}
                          >

                            {isStart && (
                              <span>
                                START
                              </span>
                            )}

                            {isFinal && (
                              <span>
                                FINAL
                              </span>
                            )}

                            <code>
                              {state ===
                              "∅"
                                ? "∅"
                                : `{${state}}`}
                            </code>

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>

                {/* DFA TRANSITIONS */}

                <div className="dfa-block">

                  <h3>
                    DFA Transitions
                  </h3>

                  <div className="dfa-table-wrapper">

                    <table className="dfa-table">

                      <thead>

                        <tr>

                          <th>
                            State
                          </th>

                          {dfa.alphabet.map(
                            (symbol) => (
                              <th
                                key={
                                  symbol
                                }
                              >
                                {symbol}
                              </th>
                            )
                          )}

                        </tr>

                      </thead>

                      <tbody>

                        {dfa.states.map(
                          (state) => (

                            <tr
                              key={state}
                            >

                              <td>
                                {state ===
                                "∅"
                                  ? "∅"
                                  : `{${state}}`}
                              </td>

                              {dfa.alphabet.map(
                                (
                                  symbol
                                ) => (

                                  <td
                                    key={
                                      symbol
                                    }
                                  >
                                    {dfa
                                      .transitions[
                                      state
                                    ]?.[
                                      symbol
                                    ] ===
                                    "∅"
                                      ? "∅"
                                      : `{${dfa
                                          .transitions[
                                          state
                                        ]?.[
                                          symbol
                                        ] ?? ""}}`}
                                  </td>

                                )
                              )}

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

                {/* DFA DIAGRAM */}

                <div className="dfa-block">

                  <h3>
                    DFA Diagram
                  </h3>

                  <DFADiagram
                    states={
                      dfa.states
                    }
                    startState={
                      dfa.startState
                    }
                    finalStates={
                      dfa.finalStates
                    }
                    transitions={
                      dfa.transitions
                    }
                  />

                </div>

              </div>
            ) : (
              <div className="diagram-error">
                Click Generate / Update DFA to create the DFA from your NFA.
              </div>
            )}

        </section>

        </div>
        <div className={workspaceTab === "compare" ? "workspace-view active-view" : "workspace-view"}>
          <div className="workspace-section-intro"><span>VALIDATE / 04</span><h2>Language equivalence</h2><p>Compare acceptance on the latest NFA and equivalent DFA.</p></div>
          <ValidationPanel nfa={nfa} errors={errors} />
        </div>

      </main>

    </div>
  );
}

export default App;