import type { BaseTx } from './baseTx';
import { baseTx_symbol } from './baseTx';
import type { Serializable } from '../common/types';
import type { TransferableOutput } from './transferableOutput';
import { transferableOutput_symbol } from './transferableOutput';
import type { TransferableInput } from './transferableInput';
import { transferableInputType } from './transferableInput';

export function isBaseTx(tx: Serializable): tx is BaseTx {
  return tx._type === baseTx_symbol;
}

export function isTransferableOutput(
  out: Serializable,
): out is TransferableOutput {
  return out._type === transferableOutput_symbol;
}

export function isTransferableInput(
  out: Serializable,
): out is TransferableInput {
  return out._type === transferableInputType;
}
