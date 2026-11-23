import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface Props {
  states: string[];
  startState: string;
  finalStates: string[];
  transitions: Record<
    string,
    Record<string, string>
  >;
}

export default function DFADiagram({
  states,
  startState,
  finalStates,
  transitions,
}: Props) {
  const nodes: Node[] = states.map(
    (state, index) => {
      const isFinal =
        finalStates.includes(state);

      const isStart =
        state === startState;

      return {
        id: state,

        position: {
          x:
            100 +
            (index % 3) * 320,

          y:
            100 +
            Math.floor(index / 3) * 230,
        },

        data: {
          label: (
            <div className="state-node-content" style={{ color: "#111111", width: "100%", textAlign: "center" }}>
              {isStart && (
                <span className="start-label">
                  START
                </span>
              )}

              <span style={{ color: "#111111", fontSize: 14, fontWeight: 800, overflowWrap: "anywhere", maxWidth: "100%", lineHeight: 1.2 }}>
                {state === "∅"
                  ? "∅"
                  : `{${state}}`}
              </span>
            </div>
          ),
        },

        style: {
          width: 120,
          height: 120,

          borderRadius: "50%",

          border: isFinal
            ? "4px double #111111"
            : "2px solid #111111",

          background: "#ffffff",

          color: "#111111",

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          fontWeight: "bold",

          fontSize: "15px",
        },
      };
    }
  );

  /*
   * Group transitions that have
   * the same source and destination.
   *
   * Example:
   *
   * q0 --0--> q1
   * q0 --1--> q1
   *
   * becomes:
   *
   * q0 --0, 1--> q1
   */

  const edgeMap = new Map<
    string,
    {
      source: string;
      target: string;
      symbols: string[];
    }
  >();

  Object.entries(
    transitions
  ).forEach(
    ([from, symbols]) => {
      Object.entries(symbols).forEach(
        ([symbol, to]) => {
          const key = `${from}|||${to}`;

          if (!edgeMap.has(key)) {
            edgeMap.set(key, {
              source: from,
              target: to,
              symbols: [],
            });
          }

          edgeMap
            .get(key)!
            .symbols.push(symbol);
        }
      );
    }
  );

  const edges: Edge[] =
    Array.from(
      edgeMap.values()
    ).map(
      ({
        source,
        target,
        symbols,
      }) => {
        const isSelfLoop =
          source === target;

        return {
          id: `${source}|||${target}`,

          source,

          target,

          label:
            symbols.join(", "),

          markerEnd: {
            type:
              MarkerType.ArrowClosed,
          },

          type: isSelfLoop
            ? "default"
            : "default",

          animated: false,

          style: {
            strokeWidth: 2,
            stroke: "#727272",
          },

          labelStyle: {
            fill: "#111111",
            fontWeight: 600,
          },

          labelBgStyle: {
            fill: "#ffffff",
            stroke: "#d4d4d4",
          },

          labelBgPadding: [
            6,
            3,
          ],

          labelBgBorderRadius: 5,
        };
      }
    );

  return (
    <div
      style={{
        height: 420,
        width: "100%",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.4, maxZoom: 0.9 }}
        minZoom={0.3}
        maxZoom={1.3}
        zoomOnScroll={false}
        zoomOnPinch
        nodesDraggable
      >
        <Background />

        <Controls />
      </ReactFlow>
    </div>
  );
}