import type { BaseTx } from './baseTx';
import type { Serializable } from '../common/types';
import type { TransferableOutput } from './transferableOutput';
import type { TransferableInput } from './transferableInput';
import { TypeSymbols } from '../constants';

export function isBaseTx(tx: Serializable): tx is BaseTx {
  return tx._type === TypeSymbols.BaseTx;
}

export function isTransferableOutput(
  out: Serializable,
): out is TransferableOutput {
  return out._type === TypeSymbols.TransferableOutput;
}

export function isTransferableInput(
  out: Serializable,
): out is TransferableInput {
  return out._type === TypeSymbols.TransferableInput;
}
