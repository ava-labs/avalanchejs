import { unpack } from '../../utils/struct';
import { BaseTx as AvaxBaseTx } from '../avax/baseTx';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { PVMTx } from './abstractTx';
import { TypeSymbols } from '../constants';

/**
 * @see https://github.com/avalanche-foundation/ACPs/blob/main/ACPs/23-p-chain-native-transfers.md
 * TODO: add doc reference after D-upgrade
 */
@serializable()
export class BaseTx extends PVMTx {
  _type = TypeSymbols.PvmBaseTx;

  constructor(public readonly baseTx: AvaxBaseTx) {
    super();
  }

  static fromBytes(bytes: Uint8Array, codec: Codec): [BaseTx, Uint8Array] {
    const [baseTx, remaining] = unpack(bytes, [AvaxBaseTx], codec);
    return [new BaseTx(baseTx), remaining];
  }

  toBytes(codec: Codec) {
    return this.baseTx.toBytes(codec);
  }
}
