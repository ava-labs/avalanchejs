import type { Context } from '../../../vms/context';
import { testContext } from '../../../fixtures/context';
import { testKeys } from '../../../fixtures/secp256k1';
import { subnetValidator } from '../../../fixtures/pvm';
import {
  Address,
  BigIntPr,
  Input,
  Id,
  Int,
  OutputOwners,
  TransferableInput,
  TransferInput,
  TransferOutput,
} from '../../../serializable';
import { BaseTx, TransferableOutput, UTXOID } from '../../../serializable/avax';
import { getPVMManager } from '../../../serializable/pvm/codec';
import {
  AddSubnetValidatorTx,
  StakeableLockOut,
} from '../../../serializable/pvm';
import { secp256k1 } from '../../../crypto';

import type { GasConfig } from './calculator';
import { calculateFees } from './calculator';
import { FeeDimensionWeights } from './dimensions';
import { meterTx } from './helpers';

describe('fee calculator', () => {
  const TEST_GAS_CONFIG: GasConfig = {
    gasCap: 100_000n,
    gasPrice: 10n,
    weights: FeeDimensionWeights,
  };
  // https://github.com/ava-labs/avalanchego/blob/13a3f103fd12df1e89a60c0c922b38e17872c6f6/vms/platformvm/txs/fee/calculator_test.go#L144C22-L144C28
  it.skip('works for add subnet validator tx', () => {
    const { baseTx, auth } = txCreationHelpers(testContext);
    const unsignedTx = new AddSubnetValidatorTx(
      baseTx,
      subnetValidator(),
      auth,
    );
    const complexity = meterTx(getPVMManager().getDefaultCodec(), unsignedTx);
    const fee = calculateFees(complexity, TEST_GAS_CONFIG);
    expect(fee).toEqual(29_110n); // TODO: Fix broken test...
  });
});

/**
 * @see https://github.com/ava-labs/avalanchego/blob/13a3f103fd12df1e89a60c0c922b38e17872c6f6/vms/platformvm/txs/fee/calculator_test.go#L916
 * @param context
 * @returns
 */
const txCreationHelpers = (context: Context) => {
  const now = BigInt(new Date().getTime()) / 1000n;
  // const empty = new Id(new Uint8Array(32)).toString();
  const privateKey = testKeys()[0];
  const publicKey = secp256k1.getPublicKey(privateKey);
  // const feeTestSigners = testKeys;
  const feeTestDefaultStakeWeight = 2024n;
  const utxoId = new UTXOID(Id.fromString('txid'), new Int(2));
  const assetId = Id.fromString(context.avaxAssetID);
  const input = new TransferableInput(
    utxoId,
    assetId,
    new TransferInput(new BigIntPr(5678n), new Input([new Int(0)])),
  );
  const output = new TransferableOutput(
    assetId,
    new TransferOutput(
      new BigIntPr(1234n),
      new OutputOwners(new BigIntPr(0n), new Int(1), [
        Address.fromBytes(publicKey)[0],
      ]),
    ),
  );
  const baseTx = BaseTx.fromNative(
    context.networkID,
    context.pBlockchainID,
    [output],
    [input],
    new Uint8Array(),
  );
  const stakes = new TransferableOutput(
    assetId,
    new StakeableLockOut(
      new BigIntPr(now),
      new TransferOutput(
        new BigIntPr(feeTestDefaultStakeWeight),
        new OutputOwners(new BigIntPr(0n), new Int(1), [
          Address.fromBytes(publicKey)[0],
        ]),
      ),
    ),
  );
  const auth = new Input([new Int(0), new Int(1)]);
  return { baseTx, stakes, auth };
};
