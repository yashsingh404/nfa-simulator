# NFA to DFA Interactive Simulator

An interactive web application that allows users to **design, visualize, simulate, and convert Nondeterministic Finite Automata (NFA) into Deterministic Finite Automata (DFA)** using the Subset Construction Algorithm.

Built as an educational project for **Automata Theory and Computability**, the simulator helps students understand how finite automata work through interactive state diagrams and step-by-step conversion.

## Features

### 1. Interactive NFA Builder
- Create and configure NFA states.
- Set the input alphabet, including symbols such as `0`, `1`, `a`, and `b`.
- Select the initial and final states.
- Add, edit, and remove transitions.
- Support multiple destination states for a single input symbol.
- Support epsilon (`ε`) transitions.

### 2. NFA Visualization
- Visualize the NFA as an interactive state diagram.
- Display states, transitions, and transition labels.
- Identify initial and accepting states.
- Explore the structure of the automaton.

### 3. NFA to DFA Conversion
- Convert the configured NFA into an equivalent DFA.
- Apply the **Subset Construction Algorithm**.
- Compute epsilon closures where required.
- Generate DFA states from subsets of NFA states.
- Display the resulting DFA transition table and state diagram.

### 4. Step-by-Step Conversion
Understand the conversion process through interactive controls:

- **Previous:** View the preceding conversion step.
- **Next:** Move to the next step.
- **Play:** Automatically progress through the conversion.
- **Reset:** Restart the visualization.
- **Show All:** Display the complete conversion.

### 5. String Simulation
- Enter an input string.
- Simulate its execution on the NFA.
- Determine whether the input is accepted or rejected.

### 6. NFA vs DFA Comparison
- Test input strings against the original NFA and generated DFA.
- Compare their acceptance results.
- Demonstrate that the converted DFA recognizes the same language as the NFA.

## Technologies Used

| Technology | Purpose |
|---|---|
| React | Interactive frontend |
| TypeScript | Type-safe application logic |
| Vite | Development server and build tool |
| React Flow (`@xyflow/react`) | Automata diagrams |
| CSS | Responsive UI and styling |
| Git & GitHub | Version control and collaboration |

## Algorithm Used: Subset Construction

The simulator converts an NFA into a DFA using the **Subset Construction Algorithm**, also known as the Powerset Construction Method.

**Step 1 — Calculate the initial state**

Find the epsilon closure of the NFA's initial state:

`DFA Start State = ε-closure({q0})`

**Step 2 — Process each input symbol**

For every DFA state (a set of NFA states), calculate the reachable NFA states for each input symbol.

**Step 3 — Apply epsilon closure**

Find all additional states reachable through epsilon transitions.

**Step 4 — Create DFA states**

Each unique set of reachable NFA states becomes a DFA state.

**Step 5 — Repeat**

Continue processing newly discovered states until no new subsets are generated.

**Step 6 — Identify final states**

Any DFA state containing at least one NFA final state becomes a DFA final state.

The resulting DFA recognizes the same language as the original NFA.

## Installation and Setup

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/katlarupchand18/nfa-2-dfa-simulator.git
```

### 2. Navigate to the project

```bash
cd nfa-2-dfa-simulator
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal, typically:

`http://localhost:5173/`

### 5. Build for production

```bash
npm run build
```

## Project Structure

```text
nfa-2-dfa-simulator/
├── public/
├── src/
│   ├── components/
│   │   ├── StateDiagram.tsx
│   │   ├── DFADiagram.tsx
│   │   └── ValidationPanel.tsx
│   ├── engine/
│   │   ├── nfaToDfa.ts
│   │   ├── simulator.ts
│   │   └── dfaSimulator.ts
│   ├── types/
│   │   └── nfa.ts
│   ├── utils/
│   │   └── validation.ts
│   ├── App.tsx
│   └── App.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Example

Consider an NFA with:

- States: `{q0, q1, q2}`
- Alphabet: `{0, 1}`
- Initial state: `q0`
- Final state: `q2`

Transitions:

| Current State | Input | Next State |
|---|---|---|
| q0 | 0 | {q0, q1} |
| q0 | 1 | {q0} |
| q1 | 1 | {q2} |

The corresponding DFA states are:

- `{q0}` — Initial state
- `{q0, q1}`
- `{q0, q2}` — Final state

Both automata accept the same language: binary strings ending in `01`.

## Educational Objectives

This project helps demonstrate:

- Differences between deterministic and nondeterministic finite automata.
- How epsilon transitions and epsilon closures work.
- How subset construction converts an NFA into a DFA.
- How DFA states represent sets of NFA states.
- Why NFAs and DFAs have equivalent expressive power.
- How input strings are accepted or rejected by finite automata.

## Future Enhancements

- Export automata diagrams as images.
- Save and load custom automata.
- DFA minimization.
- Additional predefined automata examples.
- Export transition tables.

## Repository

**GitHub:** https://github.com/katlarupchand18/nfa-to-dfa-simulator

## Author

**Katla Rupchand**

B.Tech — Computer Science and Engineering (Artificial Intelligence)

Bennett University

---

**Developed as an educational tool for understanding NFA-to-DFA conversion through interactive visualization.**
