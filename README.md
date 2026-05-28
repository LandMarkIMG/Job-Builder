# Landmark Nervous System UI

Update-ready React/Vite prototype for a recursive, positional visual-landmark interface.

## What changed from the canvas prototype

- Packaged as a Vite app.
- Removed dependency on shadcn project aliases so it can run standalone.
- Added lightweight local Card, Badge, Button, and Slider components.
- Added CSS utility shim so the prototype renders without a Tailwind build step.
- Preserved the core interaction model: bounded recursion, confidence filtering, positional graph nodes, semantic landmark moods, and robustness doctrine.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Main files

- `src/App.jsx` — full UI, graph data, recursive flattening, filters, details panel.
- `src/main.css` — small utility stylesheet for standalone rendering.
- `package.json` — Vite/React dependencies and scripts.

## Update notes

To update the landmark graph, edit `seedGraph` in `src/App.jsx`.

Each landmark node supports:

```js
{
  id: "LANDMARK-ID",
  name: "Readable Name",
  kind: "utility-node",
  state: "green | blue | gold | red | black | white | violet",
  confidence: 0.95,
  x: 50,
  y: 50,
  children: []
}
```

## Performance rules preserved

- Use `useMemo` to flatten and filter the graph.
- Use `useCallback` for node selection.
- Bound recursion by depth.
- Filter low-confidence landmarks before rendering.
- Draw edges in one SVG layer rather than as many DOM divs.
- Keep position stable so x/y becomes spatial memory.

## Next robust upgrade path

1. Move graph data to `src/data/landmarks.json`.
2. Add clustering for 100+ nodes.
3. Add viewport culling for 1,000+ nodes.
4. Add WebSocket observation feed.
5. Add simulation mode for confidence drift, spoof conflict, and neighbor quorum.
