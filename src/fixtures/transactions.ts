import {
  BaseTx,
  TransferableInput,
  TransferableOutput,
  UTXOID,
} from '../serializable/avax';
import { Utxo } from '../serializable/avax/utxo';
import { Address, Id } from '../serializable/fxs/common';
import { OutputOwners, TransferOutput } from '../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../serializable/primitives';
import { StakeableLockIn } from '../serializable/pvm';
import { hexToBuffer } from '../utils';
import { testContext } from './context';

export const cAddressForTest = '0xfd4DFC8f567caD8a275989982c5f8f1fC82B7563';
export const privateKeyForTest =
  '4ec512bf0130a604b68b80446238f20ccd94eec8588f56c5e5c499f1d0d7e7cd';
export const xAddressForTest = 'X-fuji1w5jg0xyw2zq22nhpjar834gyeksc6wuleftqzg';
export const pAddressForTest = 'P-fuji1w5jg0xyw2zq22nhpjar834gyeksc6wuleftqzg';
export const cAddressBech32ForTest =
  'C-fuji1w5jg0xyw2zq22nhpjar834gyeksc6wul4m0lwh';

export const testAvaxAssetID = Id.fromString(testContext.avaxAssetID);
export const testOwnerAddress = Address.fromString(xAddressForTest);

export const testUTXOID1 = Id.fromHex(
  '0x009e71412d5b89d0b51e679a93cf59966c3c89346949f1976f930feddbfd765d',
);
export const testUTXOID2 = Id.fromHex(
  '0xd1f6526c4233a5af42b0c8311a9824a84f73b3e32ba637aaa7d9dd4994bccbad',
);
export const testUTXOID3 = Id.fromHex(
  '0x5199944d5f58272adff87558c5c0857d3de3be01da518431523bff2bbf1117e6',
);

const lockedUTXO = new Utxo(
  new UTXOID(testUTXOID1, new Int(0)),
  testAvaxAssetID,
  new TransferOutput(
    new BigIntPr(BigInt(30 * 1e9)),
    OutputOwners.fromNative(
      [testOwnerAddress.toBytes()],
      BigInt(Math.floor(new Date().getTime() / 1000)) + 100000n,
    ),
  ),
);

const NotTransferOutput = new Utxo(
  new UTXOID(testUTXOID2, new Int(0)),
  testAvaxAssetID,
  new StakeableLockIn(
    new BigIntPr(2000000000n),
    TransferableOutput.fromNative(
      testAvaxAssetID.toString(),
      BigInt(30 * 1e9),
      [hexToBuffer('0x12345678901234578901234567890123457890')],
    ),
  ),
);
export const getTransferableInputForTest = () =>
  TransferableInput.fromNative(
    'cwMuSYz3XjaKNwwC7tDmzyWg2eNgpEtkeKwabZ4QJD9PDsjni',
    0,
    testContext.avaxAssetID,
    50000000000n,
    [0],
  );

const validUtxo = new Utxo(
  new UTXOID(testUTXOID3, new Int(0)),
  testAvaxAssetID,
  new TransferOutput(
    new BigIntPr(BigInt(50 * 1e9)),
    OutputOwners.fromNative([testOwnerAddress.toBytes()]),
  ),
);

export const fromAddressBytes = [testOwnerAddress.toBytes()];

export const getTransferableOutForTest = (amount: bigint) => {
  return TransferableOutput.fromNative(
    testContext.avaxAssetID,
    amount,
    fromAddressBytes,
  );
};

export const testUtxos = () => [lockedUTXO, NotTransferOutput, validUtxo];

export const getBaseTxForTest = (changeAmount: bigint, blockchainId: string) =>
  BaseTx.fromNative(
    testContext.networkID,
    blockchainId,
    [getTransferableOutForTest(changeAmount)],
    [getTransferableInputForTest()],
    new Uint8Array(),
  );
