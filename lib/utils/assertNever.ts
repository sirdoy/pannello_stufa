/**
 * Exhaustive switch helper. Throws at runtime if a discriminated-union
 * variant was missed and TS narrowing failed. Used by Phase 180 forms.
 *
 * Usage:
 *   switch (x.type) {
 *     case 'a': return ...;
 *     case 'b': return ...;
 *     default: return assertNever(x);
 *   }
 */
export function assertNever(x: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(x)}`);
}
