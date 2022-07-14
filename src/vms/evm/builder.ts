import { base58 } from '@scure/base';
import { emptyId } from '../../constants/zeroValue';
import { TransferableInput, TransferableOutput } from '../../serializable/avax';
import type { Utxo } from '../../serializable/avax/utxo';
import { ExportTx, ImportTx, Input, Output } from '../../serializable/evm';
import { Address, Id } from '../../serializable/fxs/common';
import {
  Input as SepkInput,
  OutputOwners,
  TransferInput,
  TransferOutput,
} from '../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../serializable/primitives';
import { hexToBuffer } from '../../utils';
import { matchOwners } from '../../utils/matchOwners';
import { compareEVMOutputs, compareTransferableInputs } from '../../utils/sort';
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

    const assetIsAvax = base58.encode(hexToBuffer(avaxAssetID)) === assetId;

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

  newImportTx(
    networkID: number,
    blockchainID: Buffer,
    toAddress: string,
    fromAddresses: string[],
    atomics: Utxo[],
    sourceChain?: string,
    fee = 0n,
    feeAssetId?: string,
  ) {
    const map: Map<string, bigint> = new Map();

    let ins: TransferableInput[] = [];
    let outs: Output[] = [];
    let feepaid = 0n;

    // build a set of inputs which covers the fee
    atomics.forEach((atomic) => {
      const assetID: string = atomic.ID.toString();
      const output = atomic.output as TransferOutput;
      const amount = output.amount();
      let infeeamount = amount;

      if (feeAssetId && fee && feepaid < fee && feeAssetId === assetID) {
        feepaid += infeeamount;
        if (feepaid > fee) {
          infeeamount = feepaid - fee;
          feepaid = fee;
        } else {
          infeeamount = 0n;
        }
      }

      const inputSigIndicies = matchOwners(
        output.outputOwners,
        new Set(fromAddresses),
        0n,
      );

      if (!inputSigIndicies) return;

      const input = new TransferInput(
        new BigIntPr(amount),
        new SepkInput(inputSigIndicies),
      );
      const xferin: TransferableInput = new TransferableInput(
        atomic.utxoId,
        atomic.assetId,
        input,
      );

      ins.push(xferin);
      const assetFeeAmount = map.get(assetID);
      if (assetFeeAmount) {
        infeeamount += assetFeeAmount;
      }
      map.set(assetID, infeeamount);
    });

    for (const [assetID, amount] of map.entries()) {
      // Create single EVMOutput for each assetID
      outs.push(
        new Output(
          new Address(toAddress),
          new BigIntPr(amount),
          new Id(assetID),
        ),
      );
    }

    // lexicographically sort array
    ins = ins.sort(compareTransferableInputs);
    outs = outs.sort(compareEVMOutputs);

    const importTx = new ImportTx(
      new Int(this.context.networkID),
      new Id(this.context.cBlockchainID),
      sourceChain ? new Id(sourceChain) : emptyId,
      ins,
      outs,
    );
    return importTx;
  }
}
