/**
 * This implementation of `consolidate` `combine`s all elements of `arr`
 * for which `canCombine` returns `true`. It is assumed that all combinations
 * can be determined with an initial scan of `arr`, and that `canCombine` is transitive,
 * meaning if `canCombine(A, B)` and `canCombine(B, C)` then `canCombine(combine(A, B), C)`
 * @param arr - an array of elements
 * @param canCombine - a function which determines if 2 elements can combine
 * @param combine - a function which combines 2 elements
 * @returns an array combined elements
 */
export const consolidate = <T>(
  arr: readonly T[],
  canCombine: (a: T, b: T) => boolean,
  combine: (a: T, b: T) => T,
): T[] => {
  const consolidated: T[] = [];
  for (const el of arr) {
    let combined = false;
    for (let i = 0; i < consolidated.length; i++) {
      const existing = consolidated[i];
      if (canCombine(existing, el)) {
        consolidated[i] = combine(existing, el);
        combined = true;
        break;
      }
    }
    if (!combined) {
      consolidated.push(el);
    }
  }
  return consolidated;
};
