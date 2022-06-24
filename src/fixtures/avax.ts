import {
  BaseTx,
  TransferableInput,
  TransferableOutput,
  UTXOID,
} from '../components/avax';
import { TransferableOp } from '../components/avax/transferableOp';
import { Utxo } from '../components/avax/utxo';
import { Byte } from '../primatives';
import { Int } from '../primatives/int';
import { concatBytes } from '../utils/buffer';
import { CreateAssetTx } from '../vms/avm/createAssetTx';
import { ExportTx } from '../vms/avm/exportTx';
import { ImportTx } from '../vms/avm/importTx';
import { InitialState } from '../vms/avm/initialState';
import { OperationTx } from '../vms/avm/operationTx';
import { SignedTx } from '../vms/avm/signedTx';
import { id, idBytes } from './common';
import { mintOperation, mintOperationBytes } from './nft';
import {
  bytes,
  bytesBytes,
  int,
  intBytes,
  stringPr,
  stringPrBytes,
} from './primatives';
import {
  credential,
  credentialBytes,
  mintOutput,
  mintOutputBytes,
  transferInput,
  transferInputBytes,
  transferOutput,
  transferOutputBytes,
} from './secp256k1';
import { bytesForInt } from './utils/bytesFor';
import { makeList, makeListBytes } from './utils/makeList';

// https://docs.avax.network/specs/avm-transaction-serialization#transferable-output-example
export const transferableOutputBytes = () =>
  concatBytes(idBytes(), bytesForInt(7), transferOutputBytes());

export const transferableOutput = () =>
  new TransferableOutput(id(), transferOutput());

export const transferableOutputs = makeList(transferableOutput);

export const transferableOutputsBytes = makeListBytes(transferableOutputBytes);

// https://docs.avax.network/specs/avm-transaction-serialization#transferable-input-example
export const transferableInputBytes = () =>
  concatBytes(utxoIdBytes(), idBytes(), bytesForInt(5), transferInputBytes());

export const transferableInput = () =>
  new TransferableInput(utxoId(), id(), transferInput());

export const transferableInputsBytes = makeListBytes(transferableInputBytes);
export const transferableInputs = makeList(transferableInput);

export const transferableOp = () =>
  new TransferableOp(id(), makeList(utxoId)(), mintOperation());
export const transferableOpBytes = () =>
  concatBytes(
    idBytes(),
    makeListBytes(utxoIdBytes)(),
    bytesForInt(12),
    mintOperationBytes(),
  );

export const utxoIdBytes = () => concatBytes(idBytes(), bytesForInt(5));

export const utxoId = () => new UTXOID(id(), new Int(5));

export const baseTx = () =>
  new BaseTx(int(), id(), transferableOutputs(), transferableInputs(), bytes());

export const baseTxbytes = () =>
  concatBytes(
    intBytes(),
    idBytes(),
    transferableOutputsBytes(),
    transferableInputsBytes(),
    bytesBytes(),
  );

export const initialStateBytes = () =>
  concatBytes(
    intBytes(),
    bytesForInt(2),
    bytesForInt(5),
    transferInputBytes(),
    bytesForInt(6),
    mintOutputBytes(),
  );

export const initialState = () =>
  new InitialState(int(), [transferInput(), mintOutput()]);

export const createAssetTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    stringPrBytes(),
    stringPrBytes(),
    new Uint8Array([0x0f]),
    makeListBytes(initialStateBytes)(),
  );
export const createAssetTx = () =>
  new CreateAssetTx(
    baseTx(),
    stringPr(),
    stringPr(),
    new Byte(new Uint8Array([0x0f])),
    makeList(initialState)(),
  );

export const operationTx = () =>
  new OperationTx(baseTx(), makeList(transferableOp)());

export const operationTxBytes = () =>
  concatBytes(baseTxbytes(), makeListBytes(transferableOpBytes)());

export const importTx = () =>
  new ImportTx(baseTx(), id(), makeList(transferableInput)());

export const importTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    idBytes(),
    makeListBytes(transferableInputBytes)(),
  );

export const exportTx = () =>
  new ExportTx(baseTx(), id(), makeList(transferableOutput)());

export const exportTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    idBytes(),
    makeListBytes(transferableOutputBytes)(),
  );

export const signedTx = () =>
  new SignedTx(exportTx(), [credential(), credential()]);

export const signedTxBytes = () =>
  concatBytes(
    bytesForInt(4),
    exportTxBytes(),
    bytesForInt(2),
    bytesForInt(9),
    credentialBytes(),
    bytesForInt(9),
    credentialBytes(),
  );

export const utxo = () => new Utxo(utxoId(), id(), transferOutput());
export const utxoBytes = () =>
  concatBytes(utxoIdBytes(), idBytes(), bytesForInt(7), transferOutputBytes());
