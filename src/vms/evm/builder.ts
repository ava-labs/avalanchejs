import { TransferableInput, TransferableOutput } from '../../serializable/avax';
import type { Utxo } from '../../serializable/avax/utxo';
import { ExportTx, ImportTx, Input, Output } from '../../serializable/evm';
import { Address, Id } from '../../serializable/fxs/common';
import {
  OutputOwners,
  TransferInput,
  TransferOutput,
} from '../../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../../serializable/primitives';
import { addressesFromBytes } from '../../utils';
import { AddressMap, AddressMaps } from '../../utils/addressMap';
import { costCorethTx } from '../../utils/costs';
import { matchOwners } from '../../utils/matchOwners';
import { compareEVMOutputs } from '../../utils/sort';
import { EVMUnsignedTx } from '../common/evmUnsignedTx';
import { UnsignedTx } from '../common/unsignedTx';
import { getContextFromURI } from '../context/context';
import type { Context } from '../context/model';

export type EVMExportOptions = {
  locktime: bigint;
  threshold: number;
};

export class CorethBuilder {
  constructor(private readonly context: Context) {}
  static async fromURI(baseURL?: string): Promise<CorethBuilder> {
    return new CorethBuilder(await getContextFromURI(baseURL));
  }

  defaultEVMExportOptions = (
    options?: Partial<EVMExportOptions>,
  ): EVMExportOptions => {
    return {
      locktime: 0n,
      threshold: 1,
      ...options,
    };
  };

  newExportTxFromBaseFee(
    baseFee: bigint,
    amount: bigint,
    destinationChain: string,
    fromAddress: Uint8Array,
    toAddresses: Uint8Array[],
    nonce: bigint,
    assetId?: string,
    options?: Partial<EVMExportOptions>,
  ) {
    const fee = this.estimateExportCost(
      baseFee,
      amount,
      destinationChain,
      fromAddress,
      toAddresses,
      nonce,
      assetId,
      options,
    );

    return this.newExportTx(
      amount,
      destinationChain,
      fromAddress,
      toAddresses,
      fee,
      nonce,
      assetId,
      options,
    );
  }

  estimateExportCost(
    baseFee: bigint,
    amount: bigint,
    destinationChain: string,
    fromAddress: Uint8Array,
    toAddresses: Uint8Array[],
    nonce: bigint,
    assetId?: string,
    options?: Partial<EVMExportOptions>,
  ) {
    const dummyTx = this.newExportTx(
      amount,
      destinationChain,
      fromAddress,
      toAddresses,
      baseFee,
      nonce,
      assetId,
      options,
    );

    const importCost = costCorethTx(dummyTx);
    return baseFee * importCost;
  }

  newExportTx(
    amount: bigint,
    destinationChain: string,
    fromAddress: Uint8Array,
    toAddresses: Uint8Array[],
    fee: bigint,
    nonce: bigint,
    assetId = this.context.avaxAssetID,
    options?: Partial<EVMExportOptions>,
  ) {
    const { threshold, locktime } = this.defaultEVMExportOptions(options);
    const avaxAssetID = this.context.avaxAssetID;
    const evmInputConfigs: {
      amount: bigint;
      assetId: string;
    }[] = [];

    const assetIsAvax = avaxAssetID === assetId;

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
          new Address(fromAddress),
          new BigIntPr(amount),
          Id.fromString(assetId),
          new BigIntPr(nonce),
        ),
    );

    const transferableOutputs = [
      new TransferableOutput(
        Id.fromString(assetId),
        new TransferOutput(
          new BigIntPr(amount),
          new OutputOwners(
            new BigIntPr(locktime),
            new Int(threshold),
            addressesFromBytes(toAddresses),
          ),
        ),
      ),
    ];
    evmInputs.sort(Input.compare);
    return new EVMUnsignedTx(
      new ExportTx(
        new Int(this.context.networkID),
        Id.fromString(this.context.cBlockchainID),
        Id.fromString(destinationChain),
        evmInputs,
        transferableOutputs,
      ),
      [],
      new AddressMaps([new AddressMap([[new Address(fromAddress), 0]])]),
    );
  }

  /* 
  this method will handle making a dummy tx to calculate fees, and then using that to return the
  correct tx

  basefee is in nAvax
   */
  newImportTxFromBaseFee(
    toAddress: Uint8Array,
    fromAddressesBytes: Uint8Array[],
    atomics: Utxo[],
    sourceChain: string,
    baseFee = 0n,
    feeAssetId?: string,
  ) {
    const fee = this.estimateImportCost(
      toAddress,
      fromAddressesBytes,
      atomics,
      sourceChain,
      baseFee,
      feeAssetId,
    );

    return this.newImportTx(
      toAddress,
      fromAddressesBytes,
      atomics,
      sourceChain,
      fee,
      feeAssetId,
    );
  }

  estimateImportCost(
    toAddress: Uint8Array,
    fromAddressesBytes: Uint8Array[],
    atomics: Utxo[],
    sourceChain: string,
    baseFee = 0n,
    feeAssetId?: string,
  ) {
    const dummyImportTx = this.newImportTx(
      toAddress,
      fromAddressesBytes,
      atomics,
      sourceChain,
      baseFee,
      feeAssetId,
    );

    const importCost = costCorethTx(dummyImportTx);
    return baseFee * importCost;
  }

  newImportTx(
    toAddress: Uint8Array,
    fromAddressesBytes: Uint8Array[],
    atomics: Utxo[],
    sourceChain: string,
    fee = 0n,
    feeAssetId = this.context.avaxAssetID,
  ): UnsignedTx {
    const fromAddresses = addressesFromBytes(fromAddressesBytes);

    const map: Map<string, bigint> = new Map();
    const addressMaps = new AddressMaps();
    let ins: TransferableInput[] = [];
    let outs: Output[] = [];
    let feepaid = 0n;
    const inputUtxos: Utxo[] = [];

    // build a set of inputs which covers the fee
    atomics.forEach((atomic) => {
      const assetID: string = atomic.getAssetId();
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

      const sigData = matchOwners(output.outputOwners, fromAddresses, 0n);

      if (!sigData) return;

      const xferin: TransferableInput = new TransferableInput(
        atomic.utxoId,
        atomic.assetId,
        TransferInput.fromNative(amount, sigData.sigIndicies),
      );
      addressMaps.push(sigData.addressMap);
      ins.push(xferin);
      inputUtxos.push(atomic);
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
          Id.fromString(assetID),
        ),
      );
    }

    // lexicographically sort array
    ins = ins.sort(TransferableInput.compare);
    outs = outs.sort(compareEVMOutputs);

    const importTx = new ImportTx(
      new Int(this.context.networkID),
      Id.fromString(this.context.cBlockchainID),
      Id.fromString(sourceChain),
      ins,
      outs,
    );
    return new UnsignedTx(importTx, inputUtxos, addressMaps);
  }
}
