/**
 * Adds `0x` to the beginning of a string if it doesn't exist already.
 * @param val
 */
export function prepend0x(val: string) {
  if (val.slice(0, 2) == '0x') return val;
  return `0x${val}`;
}
