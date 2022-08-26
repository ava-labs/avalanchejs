import { PlatformChainID } from '../../constants/networkIDs';
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
  AddDelegatorTx,
  AddValidatorTx,
  ExportTx,
  ImportTx,
  StakeableLockIn,
  StakeableLockOut,
  Validator,
} from '../../serializable/pvm';
import {
  addressesFromBytes,
  isStakeableLockOut,
  isTransferOut,
} from '../../utils';
import { AddressMaps } from '../../utils/addressMap';
import { bigIntMin } from '../../utils/bigintMath';
import { getImportedInputsFromUtxos } from '../../utils/builderUtils';
import { matchOwners } from '../../utils/matchOwners';
import { compareTransferableOutputs } from '../../utils/sort';
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
    return new PVMBuilder(await getContextFromURI(baseURL));
  }

  /** 
    @param sourceChainID - base58 of the sourceChain. can pass in from context
    @param utxos - list of utxos
    @param toAddress - list of addresses to import into
    @param fromAddressesBytes - used for utxo selection. provide all addresses that can sign Tx
    @param options - see SpendOptions
    @param threshold - the threshold to write on the utxo
    @param locktime - the locktime to write onto the utxo

    @returns a unsignedTx
  */
  newImportTx(
    sourceChainId: string,
    utxos: Utxo[],
    toAddresses: Uint8Array[],
    fromAddressesBytes: Uint8Array[],
    options?: SpendOptions,
    threshold = 1,
    locktime = 0n,
  ) {
    const fromAddresses = addressesFromBytes(fromAddressesBytes);
    const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);

    utxos = utxos.filter(
      // Currently - only AVAX is allowed to be imported to the P-chain
      (utxo) => utxo.assetId.toString() === this.context.avaxAssetID,
    );

    const { addressMaps, importedAmounts, importedInputs, inputUTXOs } =
      getImportedInputsFromUtxos(
        utxos,
        fromAddressesBytes,
        defaultedOptions.minIssuanceTime,
      );

    const importedAvax = importedAmounts[this.context.avaxAssetID] ?? 0n;

    importedInputs.sort(TransferableInput.compare);

    if (!importedInputs.length) {
      throw new Error('no UTXOs available to import');
    }
    let inputs: TransferableInput[] = [];
    let changeOutputs: TransferableOutput[] = [];

    if (importedAvax < this.context.baseTxFee) {
      const toBurn = new Map<string, bigint>([
        [this.context.avaxAssetID, this.context.baseTxFee - importedAvax],
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
    } else if (importedAvax > this.context.baseTxFee) {
      changeOutputs.push(
        TransferableOutput.fromNative(
          this.context.avaxAssetID,
          importedAvax - this.context.baseTxFee,
          toAddresses,
          locktime,
          threshold,
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
      addressMaps,
    );
  }

  private getToBurn = (outputs: TransferableOutput[], baseFee: bigint) => {
    const toBurn = new Map<string, bigint>([
      [this.context.avaxAssetID, baseFee],
    ]);

    outputs.forEach((output) => {
      const assetId = output.assetId.value();
      toBurn.set(assetId, (toBurn.get(assetId) || 0n) + output.output.amount());
    });
    return toBurn;
  };

  /**
   * Helper function which creates an unsigned [[AddValidatorTx]]. For more granular control, you may create your own
   * [[UnsignedTx]] manually and import the [[AddValidatorTx]] class directly.
   *
   * @param utxos A list of UTXOs that the transaction is built on
   * @param fromAddresses An array of addresses as uint8Array who own the staking UTXOs the fees in AVAX
   * @param nodeID The node ID of the validator being added.
   * @param start The Unix time when the validator starts validating the Primary Network.
   * @param end The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
   * @param weight The amount being delegated in nAVAX
   * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
   * @param shares A number for the percentage times 10,000 of reward to be given to the validator when someone delegates to them.
   * @param threshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
   * @param locktime Optional. The locktime field created in the resulting reward outputs
   *
   * @returns An unsigned transaction created from the passed in parameters.
   */
  newAddValidatorTx(
    utxos: Utxo[],
    fromAddressesBytes: Uint8Array[],
    nodeID: string,
    start: bigint,
    end: bigint,
    weight: bigint,
    rewardAddresses: Uint8Array[],
    shares: number,
    options?: SpendOptions,
    threshold = 1,
    locktime = 0n,
  ) {
    const toStake = new Map<string, bigint>([
      [this.context.avaxAssetID, weight],
    ]);

    const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
    const { addressMaps, changeOutputs, inputUTXOs, inputs, stakeOutputs } =
      this.spend(
        new Map(),
        toStake,
        utxos,
        addressesFromBytes(fromAddressesBytes),
        defaultedOptions,
      );

    const validatorTx = new AddValidatorTx(
      BaseTx.fromNative(
        this.context.networkID,
        this.context.pBlockchainID,
        changeOutputs,
        inputs,
        defaultedOptions.memo,
      ),
      Validator.fromNative(nodeID, start, end, weight),
      stakeOutputs,
      OutputOwners.fromNative(rewardAddresses, locktime, threshold),
      new Int(shares),
    );
    return new UnsignedTx(validatorTx, inputUTXOs, addressMaps);
  }

  /**
   *
   * @param destinationChainID chain to send the UTXOs to
   * @param fromAddressesBytes used for filtering utxos.
   * @param utxos list of utxos to choose from
   * @param outputs list of outputs to create.
   * @param options used for filtering UTXO's
   * @returns unsingedTx containing an exportTx
   */

  newExportTx(
    destinationChainID: string,
    fromAddressesBytes: Uint8Array[],
    utxos: Utxo[],
    outputs: TransferableOutput[],
    options?: SpendOptions,
  ) {
    const fromAddresses = addressesFromBytes(fromAddressesBytes);

    const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
    const toBurn = this.getToBurn(outputs, this.context.baseTxFee);

    const { inputs, changeOutputs, addressMaps, inputUTXOs } = this.spend(
      toBurn,
      new Map(),
      utxos,
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
        Id.fromString(destinationChainID),
        outputs,
      ),
      inputUTXOs,
      addressMaps,
    );
  }

  /**
   *
   * @param utxos list of utxos to choose from
   * @param fromAddressesBytes used for filtering utxos
   * @param nodeID id of the node to delegate. starts with "NodeID-"
   * @param start The Unix time when the validator starts validating the Primary Network.
   * @param end The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
   * @param weight The amount being delegated in nAVAX
   * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
   * @param options - used for filtering utxos
   * @param threshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
   * @param locktime Optional. The locktime field created in the resulting reward outputs
   * @returns UnsingedTx
   */

  newAddDelegatorTx(
    utxos: Utxo[],
    fromAddressesBytes: Uint8Array[],
    nodeID: string,
    start: bigint,
    end: bigint,
    weight: bigint,
    rewardAddresses: Uint8Array[],
    options?: SpendOptions,
    threshold = 1,
    locktime = 0n,
  ) {
    const toStake = new Map<string, bigint>([
      [this.context.avaxAssetID, weight],
    ]);

    const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
    const { inputs, addressMaps, changeOutputs, inputUTXOs, stakeOutputs } =
      this.spend(
        new Map(),
        toStake,
        utxos,
        addressesFromBytes(fromAddressesBytes),
        defaultedOptions,
      );

    const addDelegatorTx = new AddDelegatorTx(
      BaseTx.fromNative(
        this.context.networkID,
        this.context.pBlockchainID,
        changeOutputs,
        inputs,
        defaultedOptions.memo,
      ),
      Validator.fromNative(nodeID, start, end, weight),
      stakeOutputs,
      OutputOwners.fromNative(rewardAddresses, locktime, threshold),
    );
    return new UnsignedTx(addDelegatorTx, inputUTXOs, addressMaps);
  }

  // TODO: this function is really big refactor this
  private spend(
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

    const unlockedUTXOs = utxos.filter((utxo) => {
      if (isTransferOut(utxo.output)) {
        return true;
      }
      const out = utxo.output;
      if (!isStakeableLockOut(out) || !isTransferOut(out.transferOut)) {
        return false;
      }
      return out.getLocktime() < options.minIssuanceTime;
    });
    const lockedUTXOs = utxos.filter((utxo) => {
      const out = utxo.output;
      if (!isStakeableLockOut(out)) {
        return false;
      }
      return options.minIssuanceTime < out.getLocktime();
    });
    const inputUTXOs: Utxo[] = [];
    const addressMaps = new AddressMaps();

    lockedUTXOs.forEach((utxo) => {
      const assetId = utxo.assetId.value();
      const remainingAmountToStake = amountsToStake.get(assetId) ?? 0n;

      if (!remainingAmountToStake) {
        return;
      }

      const lockedOutput = utxo.output as StakeableLockOut;
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
          new StakeableLockIn(
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
          new StakeableLockOut(
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
            new StakeableLockOut(
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

      const utxoTransferout = (
        isTransferOut(utxo.output)
          ? utxo.output
          : (utxo.output as StakeableLockOut).transferOut
      ) as TransferOutput;

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
        (amountsToStake.get(utxo.assetId.value()) ?? 0n) - amountToStake,
      );

      if (amountToStake > 0n) {
        stakeOutputs.push(
          new TransferableOutput(
            utxo.assetId,
            new TransferOutput(new BigIntPr(amountToStake), changeOwner),
          ),
        );
      }

      const remainingAmount = amountAvailableToStake - amountToStake;
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

    inputs.sort(TransferableInput.compare);
    changeOutputs.sort(compareTransferableOutputs);
    stakeOutputs.sort(compareTransferableOutputs);

    return {
      inputs,
      changeOutputs,
      stakeOutputs,
      inputUTXOs,
      addressMaps,
    };
  }
}
