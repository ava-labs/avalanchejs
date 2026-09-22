import type { Address, TransferOutput } from '../../../../serializable';
import type { MatchOwnerResult } from '../../../../utils';
import { matchOwners } from '../../../../utils';

export type verifySigMatchItem<T> = Required<{
  sigData: MatchOwnerResult;
  data: T;
}>;

export const NoSigMatchError = new Error('No addresses match UTXO owners');

/**
 * Selects the members of `set` that `fromAddresses` can actually sign for,
 * dropping the rest. Never throws on a non-match.
 *
 * Use this whenever `set` is a *subset* of the caller's UTXOs chosen by shape
 * (for example "locked and stakeable"), because a third party can put a UTXO
 * of a given shape into someone else's UTXO set: any P-chain participant can
 * create an output naming the victim among its owners, and the node indexes it
 * under the victim's address. Treating such a UTXO as a fatal error would let
 * that third party block the whole spend.
 *
 * @param set the utxo or data set, this can change depending on the calcFn
 * @param getTransferOutput a callback that takes a utxo and gets the output
 * @param fromAddresses the addresses the utxos should belong to
 * @param minIssuanceTime the minimum issuance time for the tx
 * @returns the signable members of `set`, possibly empty
 */
export function selectSignaturesMatch<T>(
  set: T[],
  getTransferOutput: (utxo: T) => TransferOutput,
  fromAddresses: readonly Address[],
  minIssuanceTime: bigint,
): readonly verifySigMatchItem<T>[] {
  return set.reduce((acc, data) => {
    const out = getTransferOutput(data);

    const sigData = matchOwners(
      out.outputOwners,
      [...fromAddresses],
      minIssuanceTime,
    );

    return sigData ? [...acc, { sigData, data }] : acc;
  }, [] as verifySigMatchItem<T>[]);
}

/**
 * As {@link selectSignaturesMatch}, but treats "nothing in the set is
 * signable" as a formulation error.
 *
 * Only valid where `set` is the caller's *complete* UTXO set: there, no match
 * at all really does mean the caller passed the wrong addresses. For a
 * shape-filtered subset use {@link selectSignaturesMatch} instead.
 *
 * @param set the utxo or data set, this can change depending on the calcFn
 * @param getTransferOutput a callback that takes a utxo and gets the output
 * @param fromAddresses the addresses the utxos should belong to
 * @param minIssuanceTime the minimum issuance time for the tx
 * @returns T[]
 * @throws Error
 */
export function verifySignaturesMatch<T>(
  set: T[],
  getTransferOutput: (utxo: T) => TransferOutput,
  fromAddresses: readonly Address[],
  minIssuanceTime: bigint,
): readonly verifySigMatchItem<T>[] {
  const outs = selectSignaturesMatch(
    set,
    getTransferOutput,
    fromAddresses,
    minIssuanceTime,
  );

  if (set.length && !outs.length) throw NoSigMatchError;

  return outs;
}
