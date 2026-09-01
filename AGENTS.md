# AGENTS.md — Omnipraxis

## Commands

- Use `pnpm` with Node `>=24`; `package.json` pins `packageManager` to `pnpm@11.3.0`.
- `pnpm dev` starts Vite and opens the browser; `pnpm preview` serves the built `dist` output.
- `pnpm build` is the only configured typecheck path: it runs `tsc -b && vite build`.
- `pnpm desktop:dev` starts the dedicated Tauri desktop app and its Vite renderer; `pnpm desktop:renderer:build` verifies the routing-free desktop frontend, and `pnpm desktop:build` creates the native executable without an installer bundle.
- `pnpm lint` runs ESLint; there is no test script, Vitest config, or separate typecheck script.
- `pnpm format` runs Prettier over the repo; lockfiles and listed binary/media assets are ignored by `.prettierignore`.
- After code edits, update `docs/architecture.md` whenever runtime boundaries, APIs, or data flow change, then run verification in this order: `pnpm format` -> `pnpm lint` -> `pnpm build`.
- CI deploys `main` to GitHub Pages by checking out LFS assets, then running `pnpm install --frozen-lockfile`, `pnpm lint`, and `pnpm build` before uploading `dist`.
- The manual Windows workflow builds the unsigned Tauri executable on `windows-latest` and uploads an artifact containing `Omnipraxis/Omnipraxis.exe`, `Omnipraxis/splats.spz`, and `Omnipraxis/colliders.glb`.

## Project Shape

- This is a single package, not a package monorepo; web and desktop Vite entries share application sources, and `pnpm-workspace.yaml` only allowlists the `unrs-resolver` install build script.
- `docs/architecture.md` documents the platform/runtime boundaries and should stay in sync with meaningful architecture changes.
- Web entry flow is `src/main.tsx` -> `src/SceneRouter.tsx` -> `src/App.tsx` -> `src/RuntimeApp.tsx`; `SceneRouter` owns pathname selection and renders the DOM scene index/not-found pages outside R3F, `App` injects the web-only `ConvaiRuntime`, and `RuntimeApp` owns the shared R3F/physics/player shell plus the active scene.
- Desktop entry flow is `desktop/src/main.tsx` -> `DesktopRoot` -> `RuntimeApp` -> `BaseScene`; it intentionally excludes scene routing and Convai.
- The Tauri host under `src-tauri/` validates `splats.spz` and `colliders.glb`, allows only those files through the asset protocol, and resolves them beside the executable in release builds. Development resolves the checked-in base assets, and `OMNIPRAXIS_SCENE_DIR` can override the scene directory.
- The desktop Vite config uses a relative base, a separate `build/desktop` output, and `publicDir: false`; do not copy the full web `public/` tree into the executable.
- Scene routes are declared in `src/scenes/sceneManifest.ts` and mapped to prop-free scene components in `src/scenes/sceneRegistry.ts`; route slugs use lowercase kebab-case and URLs are resolved relative to `import.meta.env.BASE_URL`.
- The root route is a scene index. Its links use `history.pushState`, preserve the current query/hash, and `SceneRouter` handles browser Back/Forward through `popstate`; active scenes intentionally provide no navigation UI yet.
- GitHub Pages currently receives only the root `index.html`, so nested scene paths work after client-side navigation but not as direct entry points or refresh targets. Future per-scene HTML shells should reuse the manifest and the existing initial-path resolver.
- Scene content lives under `src/scenes/`; `CircuitBreakerScene` owns its background/lights, scene asset URLs, repair state, effect configs, and player spawn call.
- Base scene assets live under `public/scenes/base/`; `BaseScene` loads `splats.spz` as a direct non-paged splat and uses the transparent collider model for physics and interaction blocking. Its optional URL props let the desktop adapter supply external asset-protocol URLs while the web registry uses the public defaults.
- Circuit breaker splat/collider assets live under `public/scenes/circuit-breaker/`; GLB props live under `public/assets/`. Build URLs must use `import.meta.env.BASE_URL` because Vite `base` is `/omnipraxis/`.
- Circuit breaker splats are a paged Spark LoD asset (`splats-lod.rad` plus `.radc` pages); do not replace them with direct `.spz` imports unless the scene/runtime design changes.
- Large scene assets must stay in Git LFS; `.gitattributes` tracks `*.glb`, `*.splat`, `*.spz`, `*.ply`, `*.rad`, and `*.radc` as LFS objects.
- Scenes should use `src/runtime/assets/GltfModel.tsx` for GLB loading/cloning, physics, and interaction proxies instead of calling `useGLTF` directly.
- `GltfModel` interactions are `PlayerInteraction` objects with mandatory `{ label, action }`; select the whole interaction object for each scene state instead of branching inside one action when labels/actions differ.
- Spark internals (`@sparkjsdev/spark`, `SplatMesh`) are isolated under `src/runtime/spark/`; scenes should use `SplatModel` instead of importing Spark directly.
- `SplatModel` reports initialized after its mounted `SplatMesh.initialized` promise resolves.
- Player code lives under `src/runtime/player/`; scenes call `usePlayer().spawn(position, yaw?, pitch?)`, and `PlayerRuntime` keeps the single `PlayerController` disabled until spawn is applied.
- `PlayerRuntime` owns centered interaction targeting, latched interaction consumption, held items, and registering the current interaction as a generic UI overlay button; it should not render DOM UI directly.
- `UIRuntime` owns the separate DOM overlay root, reticle, screen tint/message feedback, and generic keyed overlay buttons (`setOverlayButton(id, button | null)`) with UI-owned placement/styling.
- DOM UI inside the R3F tree must not return raw `<div>` elements; UI overlays create separate React DOM roots and return `null` to R3F to avoid `Div is not part of the THREE namespace` errors.
- Carried items are attached under the player's yaw node via `setHeldItem`; pass local zero transforms for held models unless intentionally offsetting them.
- Input code lives under `src/runtime/input/`; devices translate hardware state into the singleton `inputStore` through semantic position/orientation channels with absolute, delta, and velocity modalities. Velocities are persistent controls aggregated across devices, while resolved deltas are applied and cleared by the first eligible fixed physics step.
- The standard-mapped gamepad device is polled by `InputRuntime` before player consumers. Its left stick provides position velocity, right stick provides orientation velocity, L1 contributes held run state, and the rising edge of A/Cross requests interaction; time integration belongs to `PlayerController`, not the device.
- Touch input supports a transient lower-left floating joystick for movement and unclaimed touch drags for look; interaction touch is provided by the player-owned generic overlay button, not by `TouchInputDevice`.

## TypeScript / Style

- `verbatimModuleSyntax: true`: use `import type` for type-only imports.
- `erasableSyntaxOnly: true`: avoid enums, namespaces, and parameter properties.
- TypeScript has `noUnusedLocals` and `noUnusedParameters`; prefix intentionally unused args/vars with `_` to satisfy ESLint.
- ESLint warns on import ordering with blank lines between builtin, external, internal, relative, object, and type groups; type imports are last.
- `react-refresh/only-export-components` warns when TSX files export non-components; put shared hooks/context/types in `.ts` files when needed.

## OpenCode config

- `opencode.json` allows read/search tools and verification commands; it denies `git push`, `git reset`, destructive `rm -rf`, and package-add commands.
