/**
 * Converts a whole AVAX amount to nAVAX.
 *
 * The multiplication happens in floating point, so the result is rejected
 * unless it is exactly representable. Otherwise an amount with more than nine
 * decimal places either threw an opaque `RangeError` from `BigInt` or, for
 * large values, silently rounded to a different amount.
 */
export const AvaxToNAvax = (num: number) => {
  const nAvax = num * 1e9;

  if (!Number.isSafeInteger(nAvax)) {
    throw new Error(
      `cannot convert ${num} AVAX to nAVAX exactly: ${nAvax} is not a safe integer`,
    );
  }

  return BigInt(nAvax);
};
