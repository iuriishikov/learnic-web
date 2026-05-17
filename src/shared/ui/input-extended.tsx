// `input-extended.tsx` was a 1641-line library-in-a-file. It is now a
// pure barrel re-export of `./input/` — one file per input variant
// lives under `src/shared/ui/input/`. Consumers who import from
// `@/shared/ui/input-extended` continue to work unchanged.
//
// New code should prefer importing from `@/shared/ui/input` directly.
//
// Explicit `/index` path: the sibling `input.tsx` file (`Input` alias)
// would otherwise win module resolution over the `input/` folder.
export * from './input/index';
