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
