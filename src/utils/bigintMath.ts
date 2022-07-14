export const bigIntMin = (...args: bigint[]): bigint =>
  args.reduce((m, e) => (e < m ? e : m));
