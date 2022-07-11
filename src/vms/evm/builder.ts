import { base58 } from '@scure/base';
import { TransferableOutput, utils } from '../../..';
import { ExportTx, Input } from '../../serializable/evm';
import { Address, Id } from '../../serializable/fxs/common';
import { OutputOwners, TransferOutput } from '../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../serializable/primitives';
import { getContextFromURI } from '../context/context';
import type { Context } from '../context/model';

export class CorethBuilder {
  constructor(private readonly context: Context) {}
  static async fromURI(baseURL?: string): Promise<CorethBuilder> {
    return new CorethBuilder(await getContextFromURI('AVAX', baseURL));
  }

  newExportTx(
    amount: bigint,
    assetId: string,
    destinationChain: string,
    fromAddressHex: string,
    toAddresses: string[],
    nonce = 0n,
    locktime = 0n,
    threshold = 1,
    fee = 0n,
  ) {
    const avaxAssetID = this.context.avaxAssetID;
    const evmInputConfigs: {
      amount: bigint;
      assetId: string;
    }[] = [];

    const assetIsAvax =
      base58.encode(utils.hexToBuffer(avaxAssetID)) === assetId;

    if (assetIsAvax) {
      evmInputConfigs.push({
        assetId: this.context.avaxAssetID,
        amount: amount + fee,
      });
    } else {
      // if asset id isn't AVAX asset id then create 2 inputs
      // first input will be AVAX and will be for the amount of the fee
      // second input will be the ANT
      evmInputConfigs.push({
        amount: fee,
        assetId: this.context.avaxAssetID,
      });
      evmInputConfigs.push({
        amount,
        assetId,
      });
    }

    const evmInputs = evmInputConfigs.map(
      ({ assetId, amount }) =>
        new Input(
          new Address(fromAddressHex),
          new BigIntPr(amount),
          new Id(assetId),
          new BigIntPr(nonce),
        ),
    );

    const transferableOutputs = [
      new TransferableOutput(
        new Id(assetId),
        new TransferOutput(
          new BigIntPr(amount),
          new OutputOwners(
            new BigIntPr(locktime),
            new Int(threshold),
            toAddresses.map((addr) => new Address(addr)),
          ),
        ),
      ),
    ];
    evmInputs.sort(Input.compare);
    return new ExportTx(
      new Int(this.context.networkID),
      new Id(this.context.cBlockchainID),
      new Id(destinationChain),
      evmInputs,
      transferableOutputs,
    );
  }
}
