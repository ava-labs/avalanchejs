import { DEFAULT_CODEC_VERSION } from '../constants/codec';
import { getAVMManager } from '../serializable/avm/codec';
import type { Manager } from '../serializable/codec';
import type { Serializable } from '../serializable/common/types';
import type { VM } from '../serializable/constants';
import { getEVMManager } from '../serializable/evm/codec';
import { Short } from '../serializable/primitives';
import { getPVMManager } from '../serializable/pvm/codec';

export interface GenericTransaction extends Serializable {
  vm: VM;
}

export function getManagerForVM(vm: VM): Manager {
  switch (vm) {
    case 'AVM':
      return getAVMManager();
    case 'EVM':
      return getEVMManager();
    case 'PVM':
      return getPVMManager();
    default:
      throw new Error('unknown VM');
  }
}

export function unpackWithManager(vm: VM, txBytes: Uint8Array) {
  return getManagerForVM(vm).unpackTransaction(txBytes);
}

export function packTx(tx: GenericTransaction) {
  return getManagerForVM(tx.vm).packCodec(tx);
}

export function getDefaultCodecFromTx(tx: GenericTransaction) {
  return getManagerForVM(tx.vm).getCodecForVersion(
    new Short(DEFAULT_CODEC_VERSION),
  );
}
