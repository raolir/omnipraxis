# AGENTS.md — Omnipraxis

## Commands

- Use `pnpm` with Node `>=24`; `package.json` pins `packageManager` to `pnpm@11.3.0`.
- `pnpm dev` starts Vite; `pnpm build` runs `tsc -b` before `vite build`.
- `pnpm lint` is the only configured static check; there is no test script, Vitest config, or separate typecheck script.
- `pnpm format` runs Prettier over the repo; lockfiles and binary 3D/media assets are ignored by `.prettierignore`.
- After code edits, run verification in this order: `pnpm format` -> `pnpm lint` -> `pnpm build`.
- CI deploys `main` to GitHub Pages with `pnpm install --frozen-lockfile`, `pnpm lint`, then `pnpm build`.

## Project Shape

- This is a single Vite app, not a package monorepo; `pnpm-workspace.yaml` only allowlists the `unrs-resolver` install build script.
- Runtime entry flow is `src/main.tsx` -> `src/App.tsx`; `App` mounts an R3F `Canvas`, `SparkRuntime`, `InputRuntime`, and Rapier `Physics` containing `PlayerRuntime` plus the active scene.
- Scene content lives under `src/scenes/`; `CircuitBreakerScene` owns its background/lights, splat URLs, GLB collider URL, and player spawn call.
- Circuit breaker assets live under `public/scenes/circuit-breaker/`; build URLs must use `import.meta.env.BASE_URL` because Vite `base` is `/omnipraxis/`.
- Circuit breaker splats are a paged Spark LoD asset (`splats-lod.rad` plus `.radc` pages); large scene assets are tracked with Git LFS and checked out in the Pages workflow before build.
- Spark internals (`@sparkjsdev/spark`, `SplatMesh`) are isolated under `src/runtime/spark/`; scenes should use `SplatModel` instead of importing Spark directly.
- `SplatModel` reports initialized after its mounted `SplatMesh.initialized` promise resolves.
- Player code lives under `src/runtime/player/`; scenes call `usePlayer().spawn(position, yaw?, pitch?)` and `PlayerRuntime` keeps the single `PlayerController` disabled until spawn is applied.
- Input code lives under `src/runtime/input/`; devices mutate the singleton `inputStore`, and frame deltas are reset from `PlayerController`.

## TypeScript / Style

- `verbatimModuleSyntax: true`: use `import type` for type-only imports.
- `erasableSyntaxOnly: true`: avoid enums, namespaces, and parameter properties.
- TypeScript has `noUnusedLocals` and `noUnusedParameters`; prefix intentionally unused args/vars with `_` to satisfy ESLint.
- ESLint warns on import ordering with blank lines between builtin, external, internal, relative, object, and type groups; type imports are last.
- `react-refresh/only-export-components` warns when TSX files export non-components; put shared hooks/context/types in `.ts` files when needed.

## OpenCode config

- `opencode.json` allows `ls`, verification commands, and read/search tools; it denies git push/reset, destructive `rm -rf`, and package-add commands.
