/// <reference types="vite/client" />

// Convex function modules for convex-test. Explicit patterns: Vite 8's glob
// does not support the extglob pattern from the Convex docs.
export const modules = import.meta.glob(['./**/*.ts', './**/*.js', '!./**/*.test.ts', '!./**/*.d.ts'])
