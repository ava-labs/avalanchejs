export type SpendOptions = {
  minIssuanceTime?: bigint;
  changeAddresses?: readonly Uint8Array[];
  threshold?: number;
  memo?: Uint8Array;
  locktime?: bigint;
  /**
   * Optional. The most AVAX, in nAVAX, the transaction may burn as its fee.
   *
   * The X-chain fee is `context.baseTxFee`, which `getContextFromURI` copies
   * verbatim from the node's `avm.getTxFee` response. The same node serves
   * your UTXOs, so it knows your balance and can report a fee sized to it;
   * the builders burn exactly what it says and `validateStaticBurnedAmount`
   * compares against that same number. This ceiling is the only bound the
   * node does not control.
   *
   * @default undefined - no ceiling is enforced
   */
  maxFee?: bigint;
};

/**
 * Spend options with defaults applied. `maxFee` stays optional: it has no
 * sensible default, and defaulting it to a number would either break callers
 * or give false assurance.
 */
export type SpendOptionsRequired = Required<Omit<SpendOptions, 'maxFee'>> &
  Pick<SpendOptions, 'maxFee'>;

//the string is address in hex
export type SigMapping = Map<string, number>;
export type SigMappings = SigMapping[];
