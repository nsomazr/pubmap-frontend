import { useMemo } from "react";
import type { CollaborationNetworkData } from "../../types";

interface Props {
  network: CollaborationNetworkData;
  height?: number;
  onNodeClick?: (profileUrl: string) => void;
}

function layoutNodes(network: CollaborationNetworkData, width: number, height: number) {
  const primary =
    network.nodes.find((node) => node.kind === "primary") ?? network.nodes[0] ?? null;
  const others = network.nodes.filter((node) => node.id !== primary?.id);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.32;

  const positioned = new Map<string, { x: number; y: number; node: (typeof network.nodes)[0] }>();
  if (primary) {
    positioned.set(primary.id, { x: centerX, y: centerY, node: primary });
  }
  others.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(others.length, 1) - Math.PI / 2;
    positioned.set(node.id, {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      node,
    });
  });
  return positioned;
}

export function CollaborationNetwork({ network, height = 320, onNodeClick }: Props) {
  const width = 640;
  const positioned = useMemo(
    () => layoutNodes(network, width, height),
    [network, height]
  );

  if (network.nodes.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-slate-950/[0.03] p-3 ring-1 ring-slate-200/80">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[280px]" role="img">
        {network.edges.map((edge) => {
          const source = positioned.get(edge.source);
          const target = positioned.get(edge.target);
          if (!source || !target) return null;
          const strong = (edge.shared_publications ?? 1) > 1;
          return (
            <line
              key={`${edge.source}-${edge.target}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={strong ? "#3b5bdb" : "#cbd5e1"}
              strokeWidth={strong ? 2.5 : 1.5}
              strokeDasharray={edge.kind === "collaboration" && !strong ? "4 4" : undefined}
              opacity={0.85}
            />
          );
        })}

        {[...positioned.values()].map(({ x, y, node }) => {
          const isPrimary = node.kind === "primary";
          const r = isPrimary ? 28 : 22;
          const clickable = Boolean(node.profile_url && onNodeClick);
          return (
            <g
              key={node.id}
              className={clickable ? "cursor-pointer" : undefined}
              onClick={() => {
                if (node.profile_url && onNodeClick) onNodeClick(node.profile_url);
              }}
            >
              <circle
                cx={x}
                cy={y}
                r={r + 6}
                fill={isPrimary ? "#dbeafe" : "#ecfeff"}
                opacity={0.65}
              />
              <circle cx={x} cy={y} r={r} fill={isPrimary ? "#3b5bdb" : "#0d9488"} />
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                className="fill-white text-[11px] font-bold"
              >
                {node.label.slice(0, 2).toUpperCase()}
              </text>
              <text
                x={x}
                y={y + r + 16}
                textAnchor="middle"
                className="fill-slate-700 text-[10px] font-semibold"
              >
                {node.label.length > 18 ? `${node.label.slice(0, 17)}…` : node.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-xs leading-relaxed text-slate-500">
        Solid lines: authors on this publication. Dashed lines: other shared GRE publications between
        registered members. Line weight reflects how often two people appear together.
      </p>
    </div>
  );
}
