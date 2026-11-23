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
  transitions: Record<string, Record<string, string[]>>;
  activeStates?: string[];
}

export default function StateDiagram({
  states,
  startState,
  finalStates,
  transitions,
  activeStates = [],
}: Props) {
  const nodes: Node[] = states.map(
    (state, index) => {
      const isActive =
        activeStates.includes(state);

      const isFinal =
        finalStates.includes(state);

      const isStart =
        state === startState;

      return {
        id: state,

        position: {
          x:
            150 +
            (index % 3) * 290,

          y:
            100 +
            Math.floor(index / 3) * 220,
        },

        data: {
          label: (
            <div className="state-node-content" style={{ color: isActive ? "#ffffff" : "#111111", width: "100%", textAlign: "center" }}>
              {isStart && (
                <span className="start-label" style={{ color: isActive ? "#ffffff" : "#111111", fontSize: 10, fontWeight: 700 }}>
                  START
                </span>
              )}

              <span style={{ color: isActive ? "#ffffff" : "#111111", fontSize: 19, fontWeight: 800, lineHeight: 1.2, overflowWrap: "anywhere", maxWidth: "100%" }}>{state}</span>
            </div>
          ),
        },

        style: {
          width: 100,
          height: 100,

          borderRadius: "50%",

          border: isFinal
            ? "4px double #111111"
            : "2px solid #111111",

          background: isActive
            ? "#111111"
            : "#ffffff",

          color: isActive ? "#ffffff" : "#111111",

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          fontWeight: "bold",

          fontSize: "18px",

          boxShadow: isActive
            ? "0 0 0 5px rgba(0,0,0,0.12)"
            : "none",

          transition:
            "all 0.3s ease",
        },
      };
    }
  );

  const edgeMap = new Map<
    string,
    string[]
  >();

  Object.entries(transitions).forEach(
    ([from, symbols]) => {
      Object.entries(symbols).forEach(
        ([symbol, destinations]) => {
          destinations.forEach(
            (to) => {
              const key = `${from}-${to}`;

              if (!edgeMap.has(key)) {
                edgeMap.set(key, []);
              }

              edgeMap
                .get(key)!
                .push(symbol);
            }
          );
        }
      );
    }
  );

  const edges: Edge[] =
    Array.from(
      edgeMap.entries()
    ).map(
      ([key, symbols]) => {
        const separator =
          key.indexOf("-");

        const source =
          key.substring(
            0,
            separator
          );

        const target =
          key.substring(
            separator + 1
          );

        const isActive =
          activeStates.includes(
            source
          ) &&
          activeStates.includes(
            target
          );

        return {
          id: key,

          source,

          target,

          label:
            symbols.join(", "),

          markerEnd: {
            type:
              MarkerType.ArrowClosed,
          },

          animated: isActive,

          style: {
            strokeWidth: isActive
              ? 4
              : 2,

            stroke: isActive
              ? "#999999"
              : "#727272",

            transition:
              "all 0.3s ease",
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