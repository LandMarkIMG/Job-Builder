import React, { useMemo, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import { Eye, Network, ShieldCheck, Activity, AlertTriangle, Crosshair, Layers, Zap } from "lucide-react";
import "./main.css";

const STATE_STYLE = {
  green: "bg-emerald-100 border-emerald-400 text-emerald-900",
  blue: "bg-sky-100 border-sky-400 text-sky-900",
  gold: "bg-amber-100 border-amber-400 text-amber-950",
  red: "bg-rose-100 border-rose-400 text-rose-900",
  black: "bg-zinc-200 border-zinc-500 text-zinc-950",
  white: "bg-white border-zinc-300 text-zinc-800",
  violet: "bg-violet-100 border-violet-400 text-violet-950",
};

const STATE_LABEL = {
  green: "Ordinary passage",
  blue: "Observation preferred",
  gold: "High-value node",
  red: "Hazard / restricted",
  black: "Unknown / corrupted",
  white: "Human-only authority",
  violet: "Learning / supervised",
};

const seedGraph = {
  id: "EC-CORE",
  name: "Electrum Core",
  kind: "civic-root",
  state: "gold",
  confidence: 0.98,
  x: 50,
  y: 50,
  children: [
    {
      id: "WATER-CORE",
      name: "Water Core",
      kind: "utility-node",
      state: "blue",
      confidence: 0.94,
      x: 48,
      y: 24,
      children: [
        { id: "VALVE-A17", name: "Valve A17", kind: "control", state: "white", confidence: 0.91, x: 30, y: 14, children: [] },
        { id: "BIO-LEACH-02", name: "Bioleach Bed 02", kind: "process", state: "red", confidence: 0.87, x: 62, y: 12, children: [] },
      ],
    },
    {
      id: "RAIL-HUB",
      name: "Rail Handoff Hub",
      kind: "transport-node",
      state: "green",
      confidence: 0.96,
      x: 22,
      y: 62,
      children: [
        { id: "SPUR-3", name: "Spur 3", kind: "track", state: "green", confidence: 0.93, x: 10, y: 78, children: [] },
        { id: "CARGO-SEAL-9", name: "Cargo Seal 9", kind: "inspection", state: "gold", confidence: 0.89, x: 26, y: 84, children: [] },
      ],
    },
    {
      id: "ROBOT-FIELD",
      name: "EI Training Field",
      kind: "learning-zone",
      state: "violet",
      confidence: 0.92,
      x: 76,
      y: 62,
      children: [
        { id: "DOCK-11", name: "Robot Dock 11", kind: "dock", state: "green", confidence: 0.95, x: 86, y: 78, children: [] },
        { id: "UNKNOWN-5", name: "Unknown Landmark", kind: "unresolved", state: "black", confidence: 0.41, x: 68, y: 82, children: [] },
      ],
    },
  ],
};

function Card({ children, className = "" }) { return <section className={`border ${className}`}>{children}</section>; }
function CardContent({ children, className = "" }) { return <div className={className}>{children}</div>; }
function Badge({ children, className = "" }) { return <span className={`inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-800 ${className}`}>{children}</span>; }
function Button({ children, className = "" }) { return <button className={`border border-zinc-200 px-4 py-2 font-bold ${className}`}>{children}</button>; }
function Slider({ value, min, max, step, onValueChange }) { return <input className="w-full" type="range" value={value[0]} min={min} max={max} step={step} onChange={(e) => onValueChange([Number(e.target.value)])} />; }

function flattenGraph(node, parent = null, depth = 0, output = []) {
  output.push({ ...node, parent, depth });
  for (const child of node.children || []) flattenGraph(child, node.id, depth + 1, output);
  return output;
}

function visibleNodes(nodes, depthLimit, minConfidence) {
  return nodes.filter((node) => node.depth <= depthLimit && node.confidence >= minConfidence);
}

function Node({ node, active, onSelect }) {
  const size = Math.max(44, 78 - node.depth * 12);
  const style = STATE_STYLE[node.state] || STATE_STYLE.white;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: active ? 1.08 : 1 }}
      whileHover={{ scale: 1.06 }}
      onClick={() => onSelect(node)}
      className={`absolute rounded-2xl border-2 shadow-sm backdrop-blur ${style}`}
      style={{ left: `${node.x}%`, top: `${node.y}%`, width: size, height: size, transform: "translate(-50%, -50%)" }}
      title={`${node.name} · ${STATE_LABEL[node.state]}`}
    >
      <div className="flex h-full flex-col items-center justify-center px-1 text-center leading-tight">
        <Crosshair className="mb-1 h-4 w-4" />
        <span className="text-[10px] font-bold">{node.id}</span>
      </div>
    </motion.button>
  );
}

function EdgeLayer({ nodes }) {
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const edges = useMemo(() => nodes.filter((n) => n.parent && byId[n.parent]), [nodes, byId]);

  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {edges.map((node) => {
        const parent = byId[node.parent];
        return <line key={`${parent.id}-${node.id}`} x1={parent.x} y1={parent.y} x2={node.x} y2={node.y} stroke="currentColor" strokeOpacity="0.24" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />;
      })}
    </svg>
  );
}

function DetailPanel({ selected }) {
  return (
    <Card className="rounded-2xl border-zinc-200 bg-white/90 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-950">{selected.name}</h2>
            <p className="text-sm text-zinc-500">{selected.id} · {selected.kind}</p>
          </div>
          <Badge>depth {selected.depth}</Badge>
        </div>
        <div className="grid gap-3 text-sm">
          <div className="rounded-xl bg-zinc-50 p-3"><div className="mb-1 flex items-center gap-2 font-semibold text-zinc-800"><Activity className="h-4 w-4" /> Operational mood</div><div>{STATE_LABEL[selected.state]}</div></div>
          <div className="rounded-xl bg-zinc-50 p-3"><div className="mb-1 flex items-center gap-2 font-semibold text-zinc-800"><ShieldCheck className="h-4 w-4" /> Confidence</div><div className="h-2 overflow-hidden rounded-full bg-zinc-200"><div className="h-full rounded-full bg-zinc-900" style={{ width: `${selected.confidence * 100}%` }} /></div><div className="mt-1 text-xs text-zinc-500">{Math.round(selected.confidence * 100)}% witnessed certainty</div></div>
          <div className="rounded-xl bg-zinc-50 p-3"><div className="mb-1 flex items-center gap-2 font-semibold text-zinc-800"><Zap className="h-4 w-4" /> Action doctrine</div><p className="text-zinc-600">Observe, ask graph, verify permission, execute only with post-action proof.</p></div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecursiveLandmarkUI() {
  const [depthLimit, setDepthLimit] = useState(2);
  const [minConfidence, setMinConfidence] = useState(0.4);
  const allNodes = useMemo(() => flattenGraph(seedGraph), []);
  const nodes = useMemo(() => visibleNodes(allNodes, depthLimit, minConfidence), [allNodes, depthLimit, minConfidence]);
  const [selectedId, setSelectedId] = useState("EC-CORE");
  const selected = useMemo(() => nodes.find((node) => node.id === selectedId) || nodes[0], [nodes, selectedId]);
  const onSelect = useCallback((node) => setSelectedId(node.id), []);

  return (
    <div className="min-h-screen bg-gradient-to-br p-4 text-zinc-950 md:p-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="flex flex-col justify-between gap-4 rounded-3xl border border-zinc-200 bg-white/80 p-5 shadow-sm backdrop-blur md:flex-row md:items-center">
            <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-500"><Network className="h-4 w-4" /> recursive positional graph UI</div><h1 className="text-3xl font-black tracking-tight md:text-5xl">Landmark Nervous System</h1><p className="mt-2 max-w-2xl text-zinc-600">A performance-aware interface for distributed physical systems: render only useful depth, filter low-confidence noise, and let position carry meaning.</p></div>
            <div className="flex flex-wrap gap-2"><Badge className="bg-zinc-950 text-white">{nodes.length} visible nodes</Badge><Badge>memoized layout</Badge><Badge>bounded recursion</Badge></div>
          </div>
          <Card className="rounded-3xl border-zinc-200 bg-white/80 shadow-sm"><CardContent className="grid gap-5 p-5 md:grid-cols-2"><div><div className="mb-2 flex items-center gap-2 text-sm font-bold"><Layers className="h-4 w-4" /> Depth budget: {depthLimit}</div><Slider value={[depthLimit]} min={0} max={2} step={1} onValueChange={([v]) => setDepthLimit(v)} /><p className="mt-2 text-xs text-zinc-500">Limits recursive expansion to protect frame rate and attention.</p></div><div><div className="mb-2 flex items-center gap-2 text-sm font-bold"><Eye className="h-4 w-4" /> Confidence gate: {Math.round(minConfidence * 100)}%</div><Slider value={[minConfidence]} min={0} max={1} step={0.01} onValueChange={([v]) => setMinConfidence(v)} /><p className="mt-2 text-xs text-zinc-500">Hides weak observations before they become visual debt.</p></div></CardContent></Card>
          <div className="relative h-[620px] overflow-hidden rounded-3xl border border-zinc-200 bg-[radial-gradient(circle_at_center,rgba(24,24,27,0.08)_1px,transparent_1px)] bg-[length:28px_28px] shadow-inner"><EdgeLayer nodes={nodes} /><div className="absolute left-4 top-4 rounded-2xl border border-zinc-200 bg-white/85 p-3 text-xs text-zinc-600 shadow-sm backdrop-blur"><div className="font-bold text-zinc-950">Spatial rule</div>x/y position is stable semantic memory, not decoration.</div>{nodes.map((node) => <Node key={node.id} node={node} active={selected?.id === node.id} onSelect={onSelect} />)}</div>
        </div>
        <aside className="space-y-5">{selected && <DetailPanel selected={selected} />}<Card className="rounded-2xl border-zinc-200 bg-white/90 shadow-sm"><CardContent className="p-5"><div className="mb-3 flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> Robustness contract</div><div className="space-y-2 text-sm text-zinc-600"><p><strong>Low confidence:</strong> observe only.</p><p><strong>Unknown node:</strong> quarantine until witnessed by neighbor.</p><p><strong>Restricted landmark:</strong> require permission and second sensor.</p><p><strong>UI overload:</strong> collapse recursion, cluster, or virtualize.</p></div></CardContent></Card><Card className="rounded-2xl border-zinc-200 bg-zinc-950 text-white shadow-sm"><CardContent className="p-5"><div className="mb-2 text-sm font-semibold text-zinc-300">Performance doctrine</div><p className="text-lg font-black leading-tight">Render the witness, not the whole world.</p><p className="mt-2 text-sm text-zinc-300">Recursive UI should degrade by depth, confidence, proximity, user intent, and operational risk.</p><Button className="mt-4 w-full rounded-2xl bg-white text-zinc-950">Run local simulation</Button></CardContent></Card></aside>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<RecursiveLandmarkUI />);
