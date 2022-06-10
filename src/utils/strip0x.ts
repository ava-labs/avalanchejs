/**
 * Removes `0x` from the beginning of a string if it exists.
 * @param val
 */
export function strip0x(val: string) {
  if (val.slice(0, 2) == '0x') return val.slice(2);
  return val;
}
