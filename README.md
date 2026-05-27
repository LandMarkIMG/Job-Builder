# LV Job Builder Framework

A light React/Vite framework draft for a low-voltage job builder. The core idea is that the schedule sits first and biases the estimating/survey logic below it.

## GitHub + Vercel static deploy

Use this package the same way as the Monetize That app workflow:

1. Unzip the package locally.
2. Do not upload `node_modules`.
3. Commit the included files with GitHub Desktop.
4. Push to GitHub.
5. In Vercel, use:
   - Framework Preset: Other
   - Install Command: `echo "Skipping install"`
   - Build Command: `echo "Using prebuilt dist"`
   - Output Directory: `dist`

## Development

For local editing:

```bash
npm install
npm run dev
```

For rebuilding the static deploy output:

```bash
npm run build
```

## Current framework features

- Gantt-first schedule gravity model
- Editable phase start/duration controls
- Live labor, PM, and risk multipliers
- Schedule signals for compression, testing pressure, client-carried pathway, and occupancy
- Survey modules for Site Reality, Scope Modules, Responsibility Split, and Proof & Closeout
- Light visual grammar: navy structure, green active influence, brown client-carried scope, amber risk/proof
- Export narrative seed
