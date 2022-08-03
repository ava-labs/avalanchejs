import { PlatformChainID } from '../../constants/networkIDs';
import { zeroOutputOwners } from '../../constants/zeroValue';
import {
  BaseTx,
  TransferableInput,
  TransferableOutput,
} from '../../serializable/avax';
import type { Utxo } from '../../serializable/avax/utxo';
import type { Address } from '../../serializable/fxs/common';
import { Id } from '../../serializable/fxs/common';
import {
  OutputOwners,
  TransferInput,
  TransferOutput,
} from '../../serializable/fxs/secp256k1';
import { BigIntPr, Bytes, Int } from '../../serializable/primitives';
import {
  CreateSubnetTx,
  ExportTx,
  ImportTx,
  StakableLockIn,
  StakableLockOut,
} from '../../serializable/pvm';
import {
  addressesFromBytes,
  isStakeableLockOut,
  isTransferOut,
} from '../../utils';
import { AddressMaps } from '../../utils/addressMap';
import { bigIntMin } from '../../utils/bigintMath';
import { matchOwners } from '../../utils/matchOwners';
import {
  compareTransferableInputs,
  compareTransferableOutputs,
} from '../../utils/sort';
import { defaultSpendOptions } from '../common/defaultSpendOptions';
import type { SpendOptions, SpendOptionsRequired } from '../common/models';
import { UnsignedTx } from '../common/unsignedTx';
import { getContextFromURI } from '../context/context';
import type { Context } from '../context/model';

/*
  Builder is useful for building transactions that are specific to a chain.
 */

export class PVMBuilder {
  constructor(private context: Context) {}
  static async fromURI(baseURL?: string): Promise<PVMBuilder> {
    return new PVMBuilder(await getContextFromURI('AVAX', baseURL));
  }

  newCreateSubnetTx(
    fromAddressesBytes: Uint8Array[],
    utxoSet: Utxo[],
    outputs: TransferableOutput[],
    options: SpendOptions,
  ) {
    const fromAddresses = addressesFromBytes(fromAddressesBytes);

    const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
    const toBurn = this.getToBurn(outputs, this.context.createSubnetTxFee);

    const { inputs, changeOutputs } = this.spend(
      toBurn,
      new Map(),
      utxoSet,
      fromAddresses,
      defaultedOptions,
    );

    const resultOutputs = outputs.concat(changeOutputs);
    resultOutputs.sort(compareTransferableOutputs);
    return new CreateSubnetTx(
      new BaseTx(
        new Int(this.context.networkID),
        PlatformChainID,
        resultOutputs,
        inputs,
        new Bytes(defaultedOptions.memo),
      ),
      zeroOutputOwners,
    );
  }

  newImportTx(
    sourceChainId: string,
    utxos: Utxo[],
    to: OutputOwners,
    fromAddressesBytes: Uint8Array[],
    options?: SpendOptions,
  ) {
    const importedInputs: TransferableInput[] = [];
    const fromAddresses = addressesFromBytes(fromAddressesBytes);
    const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
    const sigMappings = new AddressMaps();
    const inputUTXOs: Utxo[] = [];

    let importedAmount = 0n;
    utxos.forEach((utxo) => {
      if (utxo.assetId.toString() !== this.context.avaxAssetID) {
        // Currently - only AVAX is allowed to be imported to the P-chain
        return;
      }
      if (!isTransferOut(utxo.output)) {
        return;
      }

      const sigData = matchOwners(
        utxo.output.outputOwners,
        fromAddresses,
        defaultedOptions.minIssuanceTime,
      );
      if (!sigData) {
        return;
      }
      importedInputs.push(
        new TransferableInput(
          utxo.utxoId,
          utxo.assetId,
          TransferInput.fromNative(utxo.output.amount(), sigData.sigIndicies),
        ),
      );
      sigMappings.push(sigData.addressMap);
      inputUTXOs.push(utxo);

      importedAmount += utxo.output.amount();
    });

    importedInputs.sort(compareTransferableInputs);

    if (!importedInputs.length) {
      throw new Error('no UTXOs available to import');
    }
    let inputs: TransferableInput[] = [];
    let changeOutputs: TransferableOutput[] = [];

    if (importedAmount < this.context.baseTxFee) {
      const toBurn = new Map<string, bigint>([
        [this.context.avaxAssetID, this.context.baseTxFee - importedAmount],
      ]);

      const spendRes = this.spend(
        toBurn,
        new Map(),
        utxos,
        fromAddresses,
        defaultedOptions,
      );
      inputs = spendRes.inputs;
      changeOutputs = spendRes.changeOutputs;
    } else if (importedAmount > this.context.baseTxFee) {
      changeOutputs.push(
        new TransferableOutput(
          Id.fromString(this.context.avaxAssetID),
          new TransferOutput(
            new BigIntPr(importedAmount - this.context.baseTxFee),
            to,
          ),
        ),
      );
    }

    return new UnsignedTx(
      new ImportTx(
        new BaseTx(
          new Int(this.context.networkID),
          PlatformChainID,
          changeOutputs,
          inputs,
          new Bytes(defaultedOptions.memo),
        ),
        Id.fromString(sourceChainId),
        importedInputs,
      ),
      inputUTXOs,
      sigMappings,
    );
  }

  getToBurn = (outputs: TransferableOutput[], baseFee: bigint) => {
    const toBurn = new Map<string, bigint>([
      [this.context.avaxAssetID, baseFee],
    ]);

    outputs.forEach((output) => {
      const assetId = output.assetId.value();
      toBurn.set(assetId, (toBurn.get(assetId) || 0n) + output.output.amount());
    });
    return toBurn;
  };

  newExportTx(
    chainId: string,
    fromAddressesBytes: Uint8Array[],
    utxoSet: Utxo[],
    outputs: TransferableOutput[],
    options: SpendOptions,
  ) {
    const fromAddresses = addressesFromBytes(fromAddressesBytes);

    const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
    const toBurn = this.getToBurn(outputs, this.context.baseTxFee);

    const { inputs, changeOutputs, addressMaps, inputUTXOs } = this.spend(
      toBurn,
      new Map(),
      utxoSet,
      fromAddresses,
      defaultedOptions,
    );

    outputs.sort(compareTransferableOutputs);
    return new UnsignedTx(
      new ExportTx(
        new BaseTx(
          new Int(this.context.networkID),
          PlatformChainID,
          changeOutputs,
          inputs,
          new Bytes(defaultedOptions.memo),
        ),
        Id.fromString(chainId),
        outputs,
      ),
      inputUTXOs,
      addressMaps,
    );
  }

  // TODO: this function is really big refactor this
  spend(
    amountsToBurn: Map<string, bigint>,
    amountsToStake: Map<string, bigint>,
    utxos: Utxo[],
    fromAddresses: Address[],
    options: SpendOptionsRequired,
  ): {
    stakeOutputs: TransferableOutput[];
    changeOutputs: TransferableOutput[];
    inputs: TransferableInput[];
    inputUTXOs: Utxo[];
    addressMaps: AddressMaps;
  } {
    const inputs: TransferableInput[] = [];
    const changeOutputs: TransferableOutput[] = [];
    const stakeOutputs: TransferableOutput[] = [];
    const changeOwner = new OutputOwners(
      new BigIntPr(0n),
      new Int(1),
      addressesFromBytes(options.changeAddresses),
    );

    const unlockedUTXOs = utxos.filter((utxo) => isTransferOut(utxo.output));
    const lockedUTXOs = utxos.filter((utxo) => isStakeableLockOut(utxo.output));
    const inputUTXOs: Utxo[] = [];
    const addressMaps = new AddressMaps();

    lockedUTXOs.forEach((utxo) => {
      const assetId = utxo.assetId.value();
      const remainingAmountToStake = amountsToStake.get(assetId) ?? 0n;

      if (!remainingAmountToStake) {
        return;
      }

      const lockedOutput = utxo.output as StakableLockOut;
      if (options.minIssuanceTime >= lockedOutput.lockTime.value()) {
        return;
      }

      if (!(lockedOutput.transferOut instanceof TransferOutput)) {
        throw new Error('unknown output type');
      }

      const out = lockedOutput.transferOut as TransferOutput;

      const sigData = matchOwners(
        out.outputOwners,
        fromAddresses,
        options.minIssuanceTime,
      );

      if (!sigData) {
        return;
      }

      inputs.push(
        new TransferableInput(
          utxo.utxoId,
          utxo.assetId,
          new StakableLockIn(
            lockedOutput.lockTime,
            TransferInput.fromNative(out.amount(), sigData.sigIndicies),
          ),
        ),
      );
      inputUTXOs.push(utxo);
      addressMaps.push(sigData.addressMap);

      const amountToStake = bigIntMin(remainingAmountToStake, out.amt.value());
      stakeOutputs.push(
        new TransferableOutput(
          utxo.assetId,
          new StakableLockOut(
            lockedOutput.lockTime,
            new TransferOutput(new BigIntPr(amountToStake), out.outputOwners),
          ),
        ),
      );
      amountsToStake.set(assetId, remainingAmountToStake - amountToStake);
      const remainingAmount = out.amount() - amountToStake;
      if (remainingAmount > 0n) {
        changeOutputs.push(
          new TransferableOutput(
            utxo.assetId,
            new StakableLockOut(
              lockedOutput.lockTime,
              new TransferOutput(
                new BigIntPr(remainingAmount),
                out.outputOwners,
              ),
            ),
          ),
        );
      }
    });

    unlockedUTXOs.forEach((utxo) => {
      const remainingAmountToBurn =
        amountsToBurn.get(utxo.assetId.value()) ?? 0n;
      const remainingAmountToStake =
        amountsToStake.get(utxo.assetId.value()) ?? 0n;
      if (!remainingAmountToBurn && !remainingAmountToStake) {
        return;
      }

      const utxoTransferout = utxo.output as TransferOutput;

      const sigData = matchOwners(
        utxoTransferout.outputOwners,
        fromAddresses,
        options.minIssuanceTime,
      );

      if (!sigData) {
        return;
      }

      inputs.push(
        new TransferableInput(
          utxo.utxoId,
          utxo.assetId,
          TransferInput.fromNative(
            utxoTransferout.amount(),
            sigData.sigIndicies,
          ),
        ),
      );

      inputUTXOs.push(utxo);
      addressMaps.push(sigData.addressMap);

      const amountToBurn = bigIntMin(
        remainingAmountToBurn,
        utxoTransferout.amt.value(),
      );

      amountsToBurn.set(
        utxo.assetId.value(),
        remainingAmountToBurn - amountToBurn,
      );

      const amountAvailableToStake = utxoTransferout.amount() - amountToBurn;
      const amountToStake = bigIntMin(
        remainingAmountToStake,
        amountAvailableToStake,
      );

      amountsToStake.set(
        utxo.assetId.value(),
        amountsToStake.get(utxo.assetId.value()) ?? 0n - amountToStake,
      );

      if (amountToStake > 0n) {
        stakeOutputs.push(
          new TransferableOutput(
            utxo.assetId,
            new TransferOutput(new BigIntPr(amountToStake), changeOwner),
          ),
        );
      }

      const remainingAmount = utxoTransferout.amt.value() - amountToBurn;
      if (remainingAmount > 0) {
        changeOutputs.push(
          new TransferableOutput(
            utxo.assetId,
            new TransferOutput(new BigIntPr(remainingAmount), changeOwner),
          ),
        );
      }
    });

    amountsToBurn.forEach((amount, assetId) => {
      if (amount !== 0n) {
        throw new Error(
          `insufficient funds: need ${amount} more units of ${assetId}`,
        );
      }
    });

    amountsToStake.forEach((amount, assetId) => {
      if (amount !== 0n) {
        throw new Error(
          `insufficient funds: need ${amount} more units of ${assetId} to stake`,
        );
      }
    });

    inputs.sort(compareTransferableInputs);
    changeOutputs.sort(compareTransferableOutputs);
    stakeOutputs.sort(compareTransferableOutputs);

    return {
      inputs,
      changeOutputs,
      stakeOutputs,
      inputUTXOs,
      addressMaps: addressMaps,
    };
  }
}
