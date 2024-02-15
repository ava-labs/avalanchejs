import { concatBytes } from '@noble/hashes/utils';
import { ExportTx } from '../serializable/evm/exportTx';
import { ImportTx } from '../serializable/evm/importTx';
import { Input } from '../serializable/evm/input';
import { Output } from '../serializable/evm/output';
import {
  transferableInput,
  transferableInputBytes,
  transferableOutput,
  transferableOutputBytes,
} from './avax';
import { address, addressBytes, id, idBytes } from './common';
import { bigIntPr, bigIntPrBytes, int, intBytes } from './primitives';
import { makeList, makeListBytes } from './utils/makeList';

export const output = () => new Output(address(), bigIntPr(), id());
export const outputBytes = () =>
  concatBytes(addressBytes(), bigIntPrBytes(), idBytes());

export const importTx = () =>
  new ImportTx(
    int(),
    id(),
    id(),
    makeList(transferableInput)(),
    makeList(output)(),
  );

export const importTxBytes = () =>
  concatBytes(
    intBytes(),
    idBytes(),
    idBytes(),
    makeListBytes(transferableInputBytes)(),
    makeListBytes(outputBytes)(),
  );

export const input = () => new Input(address(), bigIntPr(), id(), bigIntPr());
export const inputBytes = () =>
  concatBytes(addressBytes(), bigIntPrBytes(), idBytes(), bigIntPrBytes());

export const exportTx = () =>
  new ExportTx(
    int(),
    id(),
    id(),
    makeList(input)(),
    makeList(transferableOutput)(),
  );

export const exportTxBytes = () =>
  concatBytes(
    intBytes(),
    idBytes(),
    idBytes(),
    makeListBytes(inputBytes)(),
    makeListBytes(transferableOutputBytes)(),
  );
