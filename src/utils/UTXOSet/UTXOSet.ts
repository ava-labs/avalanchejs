import type { AssetDict } from './models';
import type { Utxo } from '../../serializable/avax/utxo';
import { isTransferOut } from '../typeGuards';
import { filterDuplicateUTXOs } from '../removeDuplicateUTXOs';

export class UtxoSet {
  constructor(private utxos: Utxo[]) {
    this.utxos = filterDuplicateUTXOs(utxos);
  }

  getUTXOs() {
    return [...this.utxos];
  }

  /**
   * Organize the UTXOs as a dictionary with assetID as the key.
   */
  getAssetDict() {
    const dict = {};
    this.utxos.forEach((utxo) => {
      const assetId = utxo.assetId.toString();
      const valNow = dict[assetId] || [];
      dict[assetId] = [...valNow, utxo];
    });

    const finalDict: AssetDict = {};
    for (const assetID in dict) {
      finalDict[assetID] = new UtxoSet(dict[assetID]);
    }
    return finalDict;
  }

  /**
   * Return asset IDs that exist in this set.
   */
  getAssetIDs() {
    const ids = this.utxos.map((utxo) => utxo.assetId.toString());
    // Filter duplicates
    return ids.filter((id, index) => ids.indexOf(id) === index);
  }

  /**
   * Add a UTXO to the set, and return a new set.
   * @param utxo
   */
  push(utxo: Utxo) {
    return new UtxoSet([...this.getUTXOs(), utxo]);
  }

  /**
   * Return the UTXO ids in this set.
   */
  getUTXOIDs() {
    return this.utxos.map((utxo) => utxo.ID());
  }

  /**
   * Merge 2 UtxoSets and return a new set.
   * @param set
   */
  merge(set: UtxoSet) {
    const newUTXOs = [...this.getUTXOs(), ...set.getUTXOs()];
    return new UtxoSet(newUTXOs);
  }

  /**
   * Return UTXOs that have TransferOut outputs
   */
  getTransferOuts() {
    const utxos = this.utxos.filter((utxo) => {
      return isTransferOut(utxo.output);
    });
    return new UtxoSet(utxos);
  }
}
