import type { AssetDict } from './models';
import type { Utxo } from '../../serializable/avax/utxo';
import { isTransferOut } from '../typeGuards';

export class UtxoSet {
  constructor(private utxos: Utxo[]) {}

  getUTXOs() {
    return this.utxos;
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
   * Add a UTXO to the set
   * @param utxo
   */
  push(utxo: Utxo) {
    //TODO: Do not push duplicates
    this.utxos.push(utxo);
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
