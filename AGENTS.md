# AGENTS.md — Omnipraxis

## Commands

- Use `pnpm` with Node `>=24`; `package.json` pins `packageManager` to `pnpm@11.3.0`.
- `pnpm dev` starts Vite; `pnpm build` runs `tsc -b` before `vite build`.
- `pnpm lint` is the only configured static check; there is no test script or Vitest config yet.
- `pnpm format` runs Prettier over the repo; lockfiles and binary 3D/media assets are ignored by `.prettierignore`.
- After code edits, run verification in this order: `pnpm format` -> `pnpm lint` -> `pnpm build`.

## Project Shape

- This is currently a single Vite app, not a package monorepo; `pnpm-workspace.yaml` only allows the `unrs-resolver` build script.
- Runtime entry flow is `src/main.tsx` -> `src/App.tsx`; `App` mounts an R3F `Canvas` with Rapier physics, `InputRuntime`, and `PlayerController`.
- Input code lives under `src/runtime/input/`; devices mutate the singleton `inputStore`, and frame deltas are reset from `PlayerController`.

## TypeScript / Style

- `verbatimModuleSyntax: true`: use `import type` for type-only imports.
- `erasableSyntaxOnly: true`: avoid enums, namespaces, and parameter properties.
- ESLint warns on import ordering with blank lines between builtin, external, internal, relative, object, and type groups.

## OpenCode config

- `opencode.json` denies git commit/push and `pnpm add` commands.
