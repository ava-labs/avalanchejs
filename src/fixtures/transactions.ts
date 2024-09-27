import { Output } from '../serializable/evm';
import {
  BaseTx,
  TransferableInput,
  TransferableOutput,
  UTXOID,
} from '../serializable/avax';
import { Utxo } from '../serializable/avax/utxo';
import { Address, Id } from '../serializable/fxs/common';
import {
  OutputOwners,
  TransferInput,
  TransferOutput,
} from '../serializable/fxs/secp256k1';
import { BigIntPr, Int, Bytes } from '../serializable/primitives';
import { StakeableLockIn, StakeableLockOut } from '../serializable/pvm';
import { hexToBuffer, unpackWithManager } from '../utils';
import { testContext } from './context';
import { stringToBytes } from '@scure/base';
import type { VM } from '../serializable';

export const cAddressForTest = '0xfd4DFC8f567caD8a275989982c5f8f1fC82B7563';
export const privateKeyForTest =
  '4ec512bf0130a604b68b80446238f20ccd94eec8588f56c5e5c499f1d0d7e7cd';
export const xAddressForTest = 'X-fuji1w5jg0xyw2zq22nhpjar834gyeksc6wuleftqzg';
export const pAddressForTest = 'P-fuji1w5jg0xyw2zq22nhpjar834gyeksc6wuleftqzg';
export const cAddressBech32ForTest =
  'C-fuji1w5jg0xyw2zq22nhpjar834gyeksc6wuleftqzg';

export const testAvaxAssetID = Id.fromString(testContext.avaxAssetID);
export const testOwnerXAddress = Address.fromString(xAddressForTest);
export const testOwnerCBech32Address = Address.fromString(
  cAddressBech32ForTest,
);

export const testUTXOID1 = Id.fromHex(
  '0x009e71412d5b89d0b51e679a93cf59966c3c89346949f1976f930feddbfd765d',
);
export const testUTXOID2 = Id.fromHex(
  '0xd1f6526c4233a5af42b0c8311a9824a84f73b3e32ba637aaa7d9dd4994bccbad',
);
export const testUTXOID3 = Id.fromHex(
  '0x5199944d5f58272adff87558c5c0857d3de3be01da518431523bff2bbf1117e6',
);
export const testUTXOID4 = Id.fromHex(
  '0x5199944d5f58272adff87558c5c0857d3de3be01da518431523bff2bbf1116e6',
);

export const testSubnetId =
  '0x8c86d07cd60218661863e0116552dccd5bd84c564bd29d7181dbddd5ec616104';

export const testVMId =
  '0x61766d0000000000000000000000000000000000000000000000000000000000';

export const testGenesisData = {
  test: 'data',
};

export const testSubnetAuthData = new Bytes(
  stringToBytes('utf8', '0x0000000a0000000100000000'),
);

export const getLockedUTXO = (
  amt = new BigIntPr(BigInt(30 * 1e9)),
  lockTime = BigInt(Math.floor(new Date().getTime() / 1000)) + 100000n,
) =>
  new Utxo(
    new UTXOID(testUTXOID1, new Int(0)),
    testAvaxAssetID,
    new TransferOutput(
      amt,
      OutputOwners.fromNative([testOwnerXAddress.toBytes()], lockTime),
    ),
  );

export const getNotTransferOutput = (amt = BigInt(30 * 1e9)) =>
  new Utxo(
    new UTXOID(testUTXOID2, new Int(0)),
    testAvaxAssetID,
    new StakeableLockIn(
      new BigIntPr(2000000000n),
      TransferableOutput.fromNative(testAvaxAssetID.toString(), amt, [
        hexToBuffer('0x12345678901234578901234567890123457890'),
      ]),
    ),
  );

export const getStakeableLockoutOutput = (
  id: Id,
  amt: bigint,
  lockTime: bigint = BigInt(Math.floor(new Date().getTime() / 1000)) + 100000n,
  assetId = testAvaxAssetID,
) =>
  new Utxo(
    new UTXOID(id, new Int(0)),
    assetId,
    new StakeableLockOut(
      new BigIntPr(lockTime),
      new TransferOutput(
        new BigIntPr(amt),
        OutputOwners.fromNative([testOwnerXAddress.toBytes()]),
      ),
    ),
  );

export const getTransferableInputForTest = (amt = 50000000000n) =>
  TransferableInput.fromNative(
    'cwMuSYz3XjaKNwwC7tDmzyWg2eNgpEtkeKwabZ4QJD9PDsjni',
    0,
    testContext.avaxAssetID,
    amt,
    [0],
  );

export const getStakeableLockedTransferableInputForTest = (
  amtount: bigint,
  lockTime: bigint,
) =>
  new TransferableInput(
    new UTXOID(testUTXOID1, new Int(0)),
    Id.fromString(testContext.avaxAssetID),
    new StakeableLockIn(
      new BigIntPr(lockTime),
      TransferInput.fromNative(amtount, [0]),
    ),
  );

export const getValidUtxo = (
  amt = new BigIntPr(BigInt(50 * 1e9)),
  assetId = testAvaxAssetID,
) =>
  new Utxo(
    new UTXOID(testUTXOID3, new Int(0)),
    assetId,
    new TransferOutput(
      amt,
      OutputOwners.fromNative([testOwnerXAddress.toBytes()]),
    ),
  );

export const fromAddressBytes = [testOwnerXAddress.toBytes()];

export const getTransferableOutForTest = (
  amount: bigint,
  locktime?: bigint,
  threshold?: number,
) => {
  return TransferableOutput.fromNative(
    testContext.avaxAssetID,
    amount,
    fromAddressBytes,
    locktime,
    threshold,
  );
};

export const getStakeableLockedTransferableOutForTest = (
  amount: bigint,
  lockTime: bigint,
) => {
  return new TransferableOutput(
    Id.fromString(testContext.avaxAssetID),
    new StakeableLockOut(
      new BigIntPr(lockTime),
      new TransferOutput(
        new BigIntPr(amount),
        OutputOwners.fromNative([testOwnerXAddress.toBytes()]),
      ),
    ),
  );
};

export const testUtxos = () => [
  getLockedUTXO(),
  getNotTransferOutput(),
  getValidUtxo(),
];

export const getBaseTxForTest = (changeAmount: bigint, blockchainId: string) =>
  BaseTx.fromNative(
    testContext.networkID,
    blockchainId,
    [getTransferableOutForTest(changeAmount)],
    [getTransferableInputForTest()],
    new Uint8Array(),
  );

export const getOutputForTest = () =>
  new Output(
    testOwnerXAddress,
    new BigIntPr(BigInt(0.1 * 1e9)),
    Id.fromString(testContext.avaxAssetID),
  );

export const txHexToTransaction = (vm: VM, txHex: string) => {
  const txBytes = hexToBuffer(txHex);

  return unpackWithManager(vm, txBytes);
};
