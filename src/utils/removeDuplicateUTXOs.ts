import type { Utxo } from '../serializable/avax/utxo';

/**
 * Returns a new array of unique UTXOs.
 * @param utxos
 */
export function filterDuplicateUTXOs(utxos: Utxo[]) {
  const ids = utxos.map((utxo) => utxo.ID());
  return utxos.filter((utxo, index) => {
    return ids.indexOf(utxo.ID()) == index;
  });
}
