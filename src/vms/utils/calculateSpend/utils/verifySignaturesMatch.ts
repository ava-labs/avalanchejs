import type { MatchOwnerResult } from '../../../../utils/matchOwners';
import { matchOwners } from '../../../../utils/matchOwners';
import type { TransferOutput } from '../../../../serializable';

export type verifySigMatchItem<T> = Required<{
  sigData: MatchOwnerResult;
  data: T;
}>;

export const NoSigMatchError = new Error('No addresses match UTXO owners');

/**
 * The idea here is to verify that a given set of utxos contains any utxos that share addresses
 * with the fromAddresses array. If not we should be throwing an error as the tx is being formulated
 * incoreectly
 *
 * @param set the utxo or data set, this can change depening on the calcFn
 * @param getTransferOutput a callback that takes a utxo and gets the output
 * @param fromAddresses the addresses the utxos should belong to
 * @param options
 * @returns T[]
 */
export function verifySignaturesMatch<T>(
  set: T[],
  getTransferOutput: (utxo: T) => TransferOutput,
  fromAddresses,
  options,
): verifySigMatchItem<T>[] {
  const outs = set.reduce((acc, data) => {
    const out = getTransferOutput(data);

    const sigData = matchOwners(
      out.outputOwners,
      fromAddresses,
      options.minIssuanceTime,
    );

    return sigData ? [...acc, { sigData, data }] : acc;
  }, [] as verifySigMatchItem<T>[]);

  if (set.length && !outs.length) throw NoSigMatchError;

  return outs;
}
