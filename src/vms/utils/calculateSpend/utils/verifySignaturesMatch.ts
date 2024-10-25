import type { Address, TransferOutput } from '../../../../serializable';
import type { MatchOwnerResult } from '../../../../utils';
import { matchOwners } from '../../../../utils';

export type verifySigMatchItem<T> = Required<{
  sigData: MatchOwnerResult;
  data: T;
}>;

export const NoSigMatchError = new Error('No addresses match UTXO owners');

/**
 * The idea here is to verify that a given set of utxos contains any utxos that share addresses
 * with the fromAddresses array. If not we should be throwing an error as the tx is being formulated
 * incorrectly
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
  const outs = set.reduce((acc, data) => {
    const out = getTransferOutput(data);

    const sigData = matchOwners(
      out.outputOwners,
      [...fromAddresses],
      minIssuanceTime,
    );

    return sigData ? [...acc, { sigData, data }] : acc;
  }, [] as verifySigMatchItem<T>[]);

  if (set.length && !outs.length) throw NoSigMatchError;

  return outs;
}
