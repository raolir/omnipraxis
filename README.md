# omnipraxis

A platform for building immersive, intelligent, and interactive professional training experiences and spatial simulations.

## Tech Stack

**Core Framework**

- Vite — Build tool and development server.
- TypeScript — Static typing and tooling.
- React — UI and application architecture.
- Zustand — Global state management.

**3D & XR**

- Three.js (three) — Real-time 3D rendering engine.
- React Three Fiber (@react-three/fiber) — React renderer for Three.js scene management.
- React Three Drei (@react-three/drei) — Utility components for R3F.
- React Three XR (@react-three/xr) — WebXR integration for VR/AR experiences.
- Spark (@sparkjsdev/spark) — Gaussian splat rendering for real-time scene representation.

**Physics**

- Rapier (@react-three/rapier) — Physics engine for collision and simulation.

**AI**

- Convai (@convai/web-sdk) — Conversational AI integration.

**Development Tools**

- Leva — Real-time debug UI and parameter controls.
- ESLint — Code linting and quality enforcement.
- Prettier — Code formatting.
- pnpm — Package manager.

## Setup

### Requirements

- Node.js 24 LTS+
- pnpm 11+

## Installation

Install dependencies:

```bash
pnpm install
```

> Note: If pnpm reports blocked build scripts (e.g. `unrs-resolver`), run:
>
> ```bash
> pnpm approve-builds
> ```

## Development

Start the development server:

```bash
pnpm dev
```

## Scenes

The root application route displays the available scene index. The current routes are:

- `/omnipraxis/base` for the base splat environment.
- `/omnipraxis/circuit-breaker` for the circuit breaker training scene.

Scene links use client-side history navigation and browser Back returns to the index. GitHub Pages currently serves only the root `index.html`, so nested scene routes are not yet direct-load or refresh entry points.

To add a scene, create a prop-free scene component in `src/scenes/`, add its public slug and title to `sceneManifest.ts`, and map that slug to the component in `sceneRegistry.ts`. Public asset URLs must use `import.meta.env.BASE_URL`.

## Windows Desktop

The Tauri desktop entry mounts `BaseScene` directly without scene routing or Convai. Its release layout is:

```text
Omnipraxis.exe
splats.spz
colliders.glb
```

Close the application before replacing both scene files, preserve their filenames, and restart it to load the replacement pair. Replacement assets must share the same origin, scale, orientation, visual/collider alignment, and `[0, 0, 0]` spawn convention. The collider must be a self-contained GLB 2 file and the splat must be a gzip-compressed SPZ file.

Run the desktop app in development:

```bash
pnpm desktop:dev
```

Build only the desktop renderer on any supported development platform:

```bash
pnpm desktop:renderer:build
```

Create the native executable on Windows:

```bash
pnpm desktop:build
```

The manual `Build Windows desktop app` GitHub Actions workflow produces an unsigned `omnipraxis-windows-x64` artifact with the executable and both replaceable assets. The portable executable requires Microsoft Edge WebView2 on the target machine; the current spike does not bundle or install WebView2 and is not code-signed.

## Build

Create a production build:

```bash
pnpm build
```

## Preview

Preview the production build locally:

```bash
pnpm preview
```

## Lint

Run ESLint:

```bash
pnpm lint
```

## Format

Format the codebase with Prettier:

```bash
pnpm format
```
