/**
 * Guards for fee inputs that come from an RPC node.
 *
 * The node the SDK is pointed at is untrusted: the URL is caller-chosen, and a
 * malicious, compromised or intercepted endpoint also serves the caller's
 * UTXOs, so it knows exactly what the wallet holds. Every fee the builders
 * burn is computed from values that node reports — the X-chain static
 * `txFee`, the C-chain `eth_baseFee`, the P-chain gas `price` and fee
 * `weights` — and the burn is irreversible once the transaction is signed and
 * accepted. Nothing downstream bounds it: the SDK's own `validateBurnedAmount`
 * recomputes the expected fee from the same node-supplied numbers, so it
 * agrees with whatever the node inflated.
 *
 * These helpers give callers two independent things: well-formedness of what
 * the node said, and a ceiling the node does not control.
 */

/**
 * Rejects a node-reported numeric field that is not a non-negative integer.
 *
 * Plain `BigInt(...)` on a JSON-RPC value accepts anything that parses and
 * throws an unhelpful RangeError on anything that does not; a negative or
 * fractional weight would otherwise reach the gas arithmetic.
 */
export const requireNonNegativeInteger = (
  value: unknown,
  field: string,
): number => {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(
      `node returned an invalid ${field}: expected a non-negative integer, got ${String(
        value,
      )}`,
    );
  }

  return parsed;
};

/**
 * Rejects a node-reported value that is not a non-negative bigint.
 */
export const requireNonNegativeBigInt = (
  value: unknown,
  field: string,
): bigint => {
  let parsed: bigint;

  try {
    parsed = BigInt(value as never);
  } catch {
    throw new Error(
      `node returned an invalid ${field}: expected an integer, got ${String(
        value,
      )}`,
    );
  }

  if (parsed < 0n) {
    throw new Error(
      `node returned an invalid ${field}: expected a non-negative integer, got ${parsed}`,
    );
  }

  return parsed;
};

/**
 * Enforces a caller-supplied ceiling on a fee the node's numbers produced.
 *
 * This is the only bound in the chain that the node does not control, so it is
 * what stands between an inflated `price`/`txFee`/`baseFee` and a signed
 * transaction that destroys the wallet's balance. It is opt-in: callers that
 * pass nothing keep the previous behaviour.
 *
 * @param fee The fee the builder is about to burn, in nAVAX
 * @param maxFee The most the caller is willing to burn, in nAVAX
 * @param label Which fee this is, used in the error message
 */
export const assertFeeWithinMax = (
  fee: bigint,
  maxFee: bigint | undefined,
  label = 'fee',
): bigint => {
  if (maxFee !== undefined && fee > maxFee) {
    throw new Error(
      `${label} of ${fee} nAVAX exceeds the caller supplied maximum of ${maxFee} nAVAX; the fee is derived from values reported by the RPC node`,
    );
  }

  return fee;
};
