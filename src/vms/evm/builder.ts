import { base58 } from '@scure/base';
import { TransferableOutput, utils } from '../../..';
import { ExportTx, Input } from '../../serializable/evm';
import { Address, Id } from '../../serializable/fxs/common';
import { OutputOwners, TransferOutput } from '../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../serializable/primitives';
import { getContextFromURI } from '../context/context';
import type { Context } from '../context/model';

export type EVMExportOptions = {
  nonce: bigint;
  locktime: bigint;
  threshold: number;
  fee: bigint;
};

export class CorethBuilder {
  constructor(private readonly context: Context) {}
  static async fromURI(baseURL?: string): Promise<CorethBuilder> {
    return new CorethBuilder(await getContextFromURI('AVAX', baseURL));
  }

  defaultEVMExportOptions = (
    options?: Partial<EVMExportOptions>,
  ): EVMExportOptions => {
    return {
      nonce: 0n,
      locktime: 0n,
      threshold: 1,
      fee: 0n,
      ...options,
    };
  };

  newExportTx(
    amount: bigint,
    assetId: string,
    destinationChain: string,
    fromAddressHex: string,
    toAddresses: string[],
    options?: Partial<EVMExportOptions>,
  ) {
    const { fee, nonce, threshold, locktime } =
      this.defaultEVMExportOptions(options);
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

  // newImportTx(
  //   networkID: number,
  //   blockchainID: Buffer,
  //   toAddress: string,
  //   atomics: Utxo[],
  //   sourceChain?: string,
  //   fee = 0n,
  //   feeAssetId?: string,
  // ) {
  //   const map: Map<string, string> = new Map();

  //   let ins: TransferableInput[] = [];
  //   let outs: Output[] = [];
  //   let feepaid = 0n;

  //   // build a set of inputs which covers the fee
  //   atomics.forEach((atomic) => {
  //     const assetID: string = atomic.ID.toString();
  //     const output = atomic.output as TransferOutput;
  //     const amount = output.amount();
  //     let infeeamount = amount;

  //     if (feeAssetId && fee && feepaid < fee && feeAssetId === assetID) {
  //       feepaid += infeeamount;
  //       if (feepaid > fee) {
  //         infeeamount = feepaid - fee;
  //         feepaid = fee;
  //       } else {
  //         infeeamount = 0n;
  //       }
  //     }

  //     if (atomic.output) {
  //       const inputSigIndicies = matchOwners(
  //         atomic.output,
  //         new Set(fromAddresses),
  //         options.minIssuanceTime,
  //       );
  //     }

  //     const input = new TransferInput(new BigIntPr(amount), new SepkInput([]));
  //     const xferin: TransferableInput = new TransferableInput(
  //       atomic.utxoId,
  //       atomic.assetId,
  //       input,
  //     );

  //     ins.push(xferin);

  //     if (map.has(assetID)) {
  //       infeeamount = infeeamount.add(new BN(map.get(assetID)));
  //     }
  //     map.set(assetID, infeeamount.toString());
  //   });

  //   for (const [assetID, amount] of map) {
  //     // Create single EVMOutput for each assetID
  //     const evmOutput: EVMOutput = new EVMOutput(
  //       toAddress,
  //       new BN(amount),
  //       bintools.cb58Decode(assetID),
  //     );
  //     outs.push(evmOutput);
  //   }

  //   // lexicographically sort array
  //   ins = ins.sort(TransferableInput.comparator());
  //   outs = outs.sort(EVMOutput.comparator());

  //   const importTx: ImportTx = new ImportTx(
  //     networkID,
  //     blockchainID,
  //     sourceChain,
  //     ins,
  //     outs,
  //     fee,
  //   );
  //   return new UnsignedTx(importTx);
  // }
}
