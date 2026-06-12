# Penumbra

> *The partial shadow between full illumination and complete darkness — where every light source reveals its true shape.*

An interactive reference for the five fundamental light source types used in 3D rendering. Each light is demonstrated with a live Three.js scene, adjustable parameters, anatomy diagrams, and physics explanations.

## Live Demo

**https://jason9075.github.io/Penumbra/**

Deployed to GitHub Pages via the `main` branch CI pipeline.

## Light Sources

| Type | Three.js Equivalent | Key Trait |
|---|---|---|
| **Distant** | `DirectionalLight` | Parallel rays, no attenuation |
| **Sphere** | `PointLight` samples on sphere surface (decay = 2) | Omnidirectional, inverse-square falloff; radius widens the penumbra |
| **Rect** | `RectAreaLight` | Uniform surface emission (no shadow support in three.js) |
| **Cylinder** | Shadow-mapped `PointLight`s along axis | Radial-only emission; radius softens shadows across the axis |
| **Dome** | HDRI IBL (`scene.environment`) | Image-based diffuse + specular, no shadows |

## Development

### Prerequisites

NixOS / nix with flakes enabled, or any system with Node.js 22+ and `just`.

```sh
# Enter dev shell (auto-activates with direnv)
nix develop
# or: direnv allow
```

### Commands

```sh
just install   # npm install --ignore-scripts (NixOS noexec safe)
just dev       # Vite dev server → http://localhost:8080
just build     # Production build → dist/
just preview   # Serve dist/ locally on :8080
just clean     # Remove dist/ and node_modules/
```

### NixOS note

Home partitions mounted `noexec` prevent esbuild's native binary from running directly. `scripts/fix-noexec.cjs` copies it to `/tmp` at startup — this is handled transparently by all `just` targets and npm scripts.

## Project Structure

```
src/
  main.js      Entry point: DOM generation, tab switching, scene wiring
  scenes.js    Five Three.js WebGL scenes (one renderer per light type)
  ui.js        Modals — math principles (💡), anatomy, compare table
  data.js      Light source content: descriptions, params, SVG diagrams, math copy
  style.css    All styles; Nord-inspired dark palette
hdri/
  *.hdr        CC0 environment maps from Poly Haven (see hdri/README.md)
scripts/
  fix-noexec.cjs   NixOS noexec workaround for esbuild / native .node modules
```

## Deploy

Push to `main` — GitHub Actions builds with `npm ci && npm run build` and deploys `dist/` to GitHub Pages. The Vite `base` path is `/Light/` to match the repository name; update `vite.config.js` if your repo name differs.

## Dependencies

| Package | Purpose |
|---|---|
| `three` | 3D rendering + OrbitControls, RectAreaLight helpers |
| `katex` | Math formula rendering in the physics modal |
| `prismjs` + `prism-themes` | Syntax highlighting for code snippets |
| `vite` | Dev server and bundler |
