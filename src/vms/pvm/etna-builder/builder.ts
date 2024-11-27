/**
 * @module
 *
 * This module contains builder functions which are responsible for building
 * PVM transactions post e-upgrade (etna), which uses dynamic fees based on transaction complexity.
 */

import {
  PlatformChainID,
  PrimaryNetworkID,
} from '../../../constants/networkIDs';
import type { TransferOutput } from '../../../serializable';
import {
  BigIntPr,
  BlsSignature,
  Input,
  NodeId,
  OutputOwners,
  Stringpr,
  TransferInput,
} from '../../../serializable';
import {
  Bytes,
  Id,
  Int,
  TransferableInput,
  TransferableOutput,
} from '../../../serializable';
import { BaseTx as AvaxBaseTx } from '../../../serializable/avax';
import type { Utxo } from '../../../serializable/avax/utxo';
import { ID_LEN } from '../../../serializable/fxs/common/id';
import {
  AddPermissionlessDelegatorTx,
  AddPermissionlessValidatorTx,
  AddSubnetValidatorTx,
  BaseTx,
  CreateChainTx,
  CreateSubnetTx,
  ExportTx,
  ImportTx,
  RemoveSubnetValidatorTx,
  SubnetValidator,
  TransferSubnetOwnershipTx,
  ConvertSubnetToL1Tx,
  IncreaseL1ValidatorBalanceTx,
  DisableL1ValidatorTx,
  SetL1ValidatorWeightTx,
  RegisterL1ValidatorTx,
} from '../../../serializable/pvm';
import { createSignerOrSignerEmptyFromStrings } from '../../../serializable/pvm/signer';
import {
  AddressMaps,
  addressesFromBytes,
  bytesCompare,
  isTransferOut,
  matchOwners,
} from '../../../utils';
import { compareTransferableOutputs } from '../../../utils/sort';
import { baseTxUnsafePvm, UnsignedTx } from '../../common';
import { addDimensions, createDimensions } from '../../common/fees/dimensions';
import type { Context } from '../../context';
import type { FeeState } from '../models';
import {
  INTRINSIC_ADD_PERMISSIONLESS_DELEGATOR_TX_COMPLEXITIES,
  INTRINSIC_ADD_PERMISSIONLESS_VALIDATOR_TX_COMPLEXITIES,
  INTRINSIC_ADD_SUBNET_VALIDATOR_TX_COMPLEXITIES,
  INTRINSIC_BASE_TX_COMPLEXITIES,
  INTRINSIC_CONVERT_SUBNET_TO_L1_TX_COMPLEXITIES,
  INTRINSIC_CREATE_CHAIN_TX_COMPLEXITIES,
  INTRINSIC_CREATE_SUBNET_TX_COMPLEXITIES,
  INTRINSIC_DISABLE_L1_VALIDATOR_TX_COMPLEXITIES,
  INTRINSIC_EXPORT_TX_COMPLEXITIES,
  INTRINSIC_IMPORT_TX_COMPLEXITIES,
  INTRINSIC_INCREASE_L1_VALIDATOR_BALANCE_TX_COMPLEXITIES,
  INTRINSIC_REGISTER_L1_VALIDATOR_TX_COMPLEXITIES,
  INTRINSIC_REMOVE_SUBNET_VALIDATOR_TX_COMPLEXITIES,
  INTRINSIC_SET_L1_VALIDATOR_WEIGHT_TX_COMPLEXITIES,
  INTRINSIC_TRANSFER_SUBNET_OWNERSHIP_TX_COMPLEXITIES,
  getAuthComplexity,
  getInputComplexity,
  getOutputComplexity,
  getOwnerComplexity,
  getSignerComplexity,
  getBytesComplexity,
  getL1ValidatorsComplexity,
} from '../txs/fee';
import { spend } from './spend';
import { useSpendableLockedUTXOs, useUnlockedUTXOs } from './spend-reducers';
import type { L1Validator } from '../../../serializable/fxs/pvm/L1Validator';
import { getWarpComplexity } from '../txs/fee/complexity';

/**
 * Creates OutputOwners used for change outputs with the specified
 * `changeAddressBytes` if provided, otherwise uses the `fromAddressesBytes`.
 */
const getChangeOutputOwners = ({
  fromAddressesBytes,
  changeAddressesBytes,
}: {
  fromAddressesBytes: readonly Uint8Array[];
  changeAddressesBytes?: readonly Uint8Array[];
}): OutputOwners => {
  return OutputOwners.fromNative(
    changeAddressesBytes ?? fromAddressesBytes,
    0n,
    1,
  );
};

const getAddressMaps = ({
  inputs,
  inputUTXOs,
  minIssuanceTime,
  fromAddressesBytes,
}: {
  inputs: readonly TransferableInput[];
  inputUTXOs: readonly Utxo[];
  minIssuanceTime: bigint;
  fromAddressesBytes: readonly Uint8Array[];
}): AddressMaps => {
  return AddressMaps.fromTransferableInputs(
    inputs,
    inputUTXOs,
    minIssuanceTime,
    fromAddressesBytes,
  );
};

const getDefaultMinIssuanceTime = (): bigint => {
  return BigInt(Math.floor(new Date().getTime() / 1000));
};

/**
 * Common properties used in all PVM transaction builder functions.
 */
type CommonTxProps = Readonly<{
  /**
   * List of addresses that are used for change outputs.
   *
   * Defaults to the addresses provided in `fromAddressesBytes`.
   */
  changeAddressesBytes?: readonly Uint8Array[];
  /**
   * The current fee state returned from `PVMApi.getFeeState()`.
   */
  feeState: FeeState;
  /**
   * List of addresses that are used for selecting which UTXOs are signable.
   */
  fromAddressesBytes: readonly Uint8Array[];
  /**
   * Contains arbitrary bytes (up to 256 bytes).
   *
   * Defaults to an empty byte array.
   */
  memo?: Uint8Array;
  /**
   * Minimum time in Unix seconds.
   *
   * Defaults to the current time in Unix seconds.
   */
  minIssuanceTime?: bigint;
  /**
   * List of UTXOs that are available to be spent.
   */
  utxos: readonly Utxo[];
}>;

type TxProps<T extends Record<string, unknown>> = CommonTxProps & Readonly<T>;

type TxBuilderFn<T extends TxProps<Record<string, unknown>>> = (
  props: T,
  context: Context,
) => UnsignedTx;

export type NewBaseTxProps = TxProps<{
  /**
   * The desired output (change outputs will be added to them automatically).
   */
  outputs: readonly TransferableOutput[];
}>;

/**
 * Creates a new unsigned PVM base transaction (`BaseTx`) using calculated dynamic fees.
 *
 * @param props
 * @param context
 * @returns An UnsignedTx.
 */
export const newBaseTx: TxBuilderFn<NewBaseTxProps> = (
  {
    changeAddressesBytes,
    feeState,
    fromAddressesBytes,
    memo = new Uint8Array(),
    minIssuanceTime = getDefaultMinIssuanceTime(),
    outputs,
    utxos,
  },
  context,
) => {
  const fromAddresses = addressesFromBytes(fromAddressesBytes);
  const toBurn = new Map<string, bigint>();

  outputs.forEach((out) => {
    const assetId = out.assetId.value();
    const amountToBurn = (toBurn.get(assetId) ?? 0n) + out.amount();

    toBurn.set(assetId, amountToBurn);
  });

  const memoComplexity = getBytesComplexity(memo);

  const outputComplexity = getOutputComplexity(outputs);

  const complexity = addDimensions(
    INTRINSIC_BASE_TX_COMPLEXITIES,
    memoComplexity,
    outputComplexity,
  );

  const spendResults = spend(
    {
      changeOutputOwners: getChangeOutputOwners({
        changeAddressesBytes,
        fromAddressesBytes,
      }),
      excessAVAX: 0n,
      feeState,
      fromAddresses,
      initialComplexity: complexity,
      minIssuanceTime,
      shouldConsolidateOutputs: true,
      toBurn,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime,
    fromAddressesBytes,
  });

  const allOutputs = [...outputs, ...changeOutputs].sort(
    compareTransferableOutputs,
  );

  return new UnsignedTx(
    new BaseTx(baseTxUnsafePvm(context, allOutputs, inputs, memo)),
    inputUTXOs,
    addressMaps,
  );
};

export type NewImportTxProps = Omit<
  TxProps<{
    /**
     * The locktime to write onto the UTXO.
     */
    locktime?: bigint;
    /**
     * Base58 string of the source chain ID.
     */
    sourceChainId: string;
    /**
     * The threshold to write on the UTXO.
     */
    threshold?: number;
    /**
     * List of addresses to import into.
     */
    toAddressesBytes: readonly Uint8Array[];
  }>,
  'changeAddressesBytes'
>;

/**
 * Creates a new unsigned PVM import transaction (`ImportTx`) using calculated dynamic fees.
 *
 * @param props
 * @param context
 * @returns An UnsignedTx.
 */
export const newImportTx: TxBuilderFn<NewImportTxProps> = (
  {
    feeState,
    fromAddressesBytes,
    locktime,
    memo = new Uint8Array(),
    minIssuanceTime = getDefaultMinIssuanceTime(),
    sourceChainId,
    threshold,
    toAddressesBytes,
    utxos,
  },
  context,
) => {
  const fromAddresses = addressesFromBytes(fromAddressesBytes);

  const filteredUtxos = utxos.filter(
    (utxo): utxo is Utxo<TransferOutput> =>
      isTransferOut(utxo.output) &&
      // Currently - only AVAX is allowed to be imported to the P-Chain
      utxo.assetId.toString() === context.avaxAssetID,
  );

  const { importedInputs, importedAmounts, inputUtxos } = filteredUtxos.reduce<{
    importedInputs: TransferableInput[];
    importedAmounts: Record<string, bigint>;
    inputUtxos: Utxo[];
  }>(
    (acc, utxo) => {
      const { sigIndicies: inputSigIndices } =
        matchOwners(utxo.getOutputOwners(), fromAddresses, minIssuanceTime) ||
        {};

      if (inputSigIndices === undefined) {
        // We couldn't spend this UTXO, so we skip to the next one.
        return acc;
      }

      const assetId = utxo.getAssetId();

      return {
        importedInputs: [
          ...acc.importedInputs,
          new TransferableInput(
            utxo.utxoId,
            utxo.assetId,
            new TransferInput(
              utxo.output.amt,
              new Input(inputSigIndices.map((value) => new Int(value))),
            ),
          ),
        ],
        importedAmounts: {
          ...acc.importedAmounts,
          [assetId]:
            (acc.importedAmounts[assetId] ?? 0n) + utxo.output.amount(),
        },
        inputUtxos: [...acc.inputUtxos, utxo],
      };
    },
    { importedInputs: [], importedAmounts: {}, inputUtxos: [] },
  );

  if (importedInputs.length === 0) {
    throw new Error('no UTXOs available to import');
  }

  const importedAvax = importedAmounts[context.avaxAssetID];

  const addressMaps = AddressMaps.fromTransferableInputs(
    importedInputs,
    filteredUtxos,
    minIssuanceTime,
    fromAddressesBytes,
  );

  const outputs: TransferableOutput[] = Object.entries(importedAmounts)
    .filter(([assetID]) => assetID !== context.avaxAssetID)
    .map(([assetID, amount]) =>
      TransferableOutput.fromNative(assetID, amount, toAddressesBytes),
    );

  const memoComplexity = getBytesComplexity(memo);

  const inputComplexity = getInputComplexity(importedInputs);

  const outputComplexity = getOutputComplexity(outputs);

  const complexity = addDimensions(
    INTRINSIC_IMPORT_TX_COMPLEXITIES,
    memoComplexity,
    inputComplexity,
    outputComplexity,
  );

  const spendResults = spend(
    {
      changeOutputOwners: OutputOwners.fromNative(
        toAddressesBytes,
        locktime,
        threshold,
      ),
      excessAVAX: importedAvax,
      feeState,
      fromAddresses,
      initialComplexity: complexity,
      minIssuanceTime,
      utxos: filteredUtxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  // Note: We don't use the `inputUTXOs` from `spendResults`
  // for the `UnsignedTx` because we want to use the original
  // UTXOs that were imported.
  const { changeOutputs, inputs } = spendResults;

  return new UnsignedTx(
    new ImportTx(
      new AvaxBaseTx(
        new Int(context.networkID),
        PlatformChainID,
        [...outputs, ...changeOutputs].sort(compareTransferableOutputs),
        inputs,
        new Bytes(memo),
      ),
      Id.fromString(sourceChainId),
      importedInputs.sort(TransferableInput.compare),
    ),
    inputUtxos,
    addressMaps,
  );
};

export type NewExportTxProps = TxProps<{
  /**
   * Base58 string of the destination chain ID.
   */
  destinationChainId: string;
  /**
   * List of outputs to create.
   */
  outputs: readonly TransferableOutput[];
}>;

/**
 * Creates a new unsigned PVM export transaction (`ExportTx`) using calculated dynamic fees.
 *
 * @param props
 * @param context
 * @returns An UnsignedTx.
 */
export const newExportTx: TxBuilderFn<NewExportTxProps> = (
  {
    changeAddressesBytes,
    destinationChainId,
    feeState,
    fromAddressesBytes,
    memo = new Uint8Array(),
    minIssuanceTime = getDefaultMinIssuanceTime(),
    outputs,
    utxos,
  },
  context,
) => {
  const fromAddresses = addressesFromBytes(fromAddressesBytes);

  const toBurn = new Map<string, bigint>();

  outputs.forEach((output) => {
    const assetId = output.assetId.value();
    toBurn.set(assetId, (toBurn.get(assetId) ?? 0n) + output.output.amount());
  });

  const memoComplexity = getBytesComplexity(memo);

  const outputComplexity = getOutputComplexity(outputs);

  const complexity = addDimensions(
    INTRINSIC_EXPORT_TX_COMPLEXITIES,
    memoComplexity,
    outputComplexity,
  );

  const spendResults = spend(
    {
      changeOutputOwners: getChangeOutputOwners({
        changeAddressesBytes,
        fromAddressesBytes,
      }),
      excessAVAX: 0n,
      feeState,
      fromAddresses,
      initialComplexity: complexity,
      minIssuanceTime,
      toBurn,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime,
    fromAddressesBytes,
  });

  return new UnsignedTx(
    new ExportTx(
      new AvaxBaseTx(
        new Int(context.networkID),
        PlatformChainID,
        changeOutputs,
        inputs,
        new Bytes(memo),
      ),
      Id.fromString(destinationChainId),
      [...outputs].sort(compareTransferableOutputs),
    ),
    inputUTXOs,
    addressMaps,
  );
};

export type NewCreateSubnetTxProps = TxProps<{
  /**
   * The locktime to write onto the UTXO.
   */
  locktime?: bigint;
  subnetOwners: readonly Uint8Array[];
  /**
   * The threshold to write on the UTXO.
   */
  threshold?: number;
}>;

/**
 * Creates a new unsigned PVM create subnet transaction (`CreateSubnetTx`) using calculated dynamic fees.
 *
 * @param props
 * @param context
 * @returns An UnsignedTx.
 */
export const newCreateSubnetTx: TxBuilderFn<NewCreateSubnetTxProps> = (
  {
    changeAddressesBytes,
    fromAddressesBytes,
    feeState,
    locktime,
    memo = new Uint8Array(),
    minIssuanceTime = getDefaultMinIssuanceTime(),
    subnetOwners,
    threshold,
    utxos,
  },
  context,
) => {
  const memoComplexity = getBytesComplexity(memo);

  const ownerComplexity = getOwnerComplexity(
    OutputOwners.fromNative(subnetOwners, locktime, threshold),
  );

  const complexity = addDimensions(
    INTRINSIC_CREATE_SUBNET_TX_COMPLEXITIES,
    memoComplexity,
    ownerComplexity,
  );

  const spendResults = spend(
    {
      changeOutputOwners: getChangeOutputOwners({
        changeAddressesBytes,
        fromAddressesBytes,
      }),
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      minIssuanceTime,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime,
    fromAddressesBytes,
  });

  const createSubnetTx = new CreateSubnetTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      memo,
    ),
    OutputOwners.fromNative(subnetOwners, locktime, threshold),
  );

  return new UnsignedTx(createSubnetTx, inputUTXOs, addressMaps);
};

export type NewCreateChainTxProps = TxProps<{
  /**
   * A human readable name for the chain.
   */
  chainName: string;
  /**
   * IDs of the feature extensions running on the new chain.
   */
  fxIds: readonly string[];
  /**
   * JSON config for the genesis data.
   */
  genesisData: Record<string, unknown>;
  /**
   * Indices of subnet owners.
   */
  subnetAuth: readonly number[];
  /**
   * ID of the subnet (Avalanche L1) that validates this chain.
   */
  subnetId: string;
  /**
   * ID of the VM running on the new chain.
   */
  vmId: string;
}>;

/**
 * Creates a new unsigned PVM create chain transaction (`CreateChainTx`) using calculated dynamic fees.
 *
 * @param props
 * @param context
 * @returns An UnsignedTx.
 */
export const newCreateChainTx: TxBuilderFn<NewCreateChainTxProps> = (
  {
    changeAddressesBytes,
    chainName,
    feeState,
    fromAddressesBytes,
    fxIds,
    genesisData,
    memo = new Uint8Array(),
    minIssuanceTime = getDefaultMinIssuanceTime(),
    subnetAuth,
    subnetId,
    utxos,
    vmId,
  },
  context,
) => {
  const genesisBytes = new Bytes(
    new TextEncoder().encode(JSON.stringify(genesisData)),
  );

  const subnetAuthInput = Input.fromNative(subnetAuth);

  const dynamicComplexity = createDimensions({
    bandwidth:
      fxIds.length * ID_LEN +
      chainName.length +
      genesisBytes.length +
      memo.length,
    dbRead: 0,
    dbWrite: 0,
    compute: 0,
  });

  const authComplexity = getAuthComplexity(subnetAuthInput);

  const complexity = addDimensions(
    INTRINSIC_CREATE_CHAIN_TX_COMPLEXITIES,
    dynamicComplexity,
    authComplexity,
  );

  const spendResults = spend(
    {
      changeOutputOwners: getChangeOutputOwners({
        changeAddressesBytes,
        fromAddressesBytes,
      }),
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      minIssuanceTime,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime,
    fromAddressesBytes,
  });

  const createChainTx = new CreateChainTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      memo,
    ),
    Id.fromString(subnetId),
    new Stringpr(chainName),
    Id.fromString(vmId),
    fxIds.map(Id.fromString.bind(Id)),
    genesisBytes,
    subnetAuthInput,
  );

  return new UnsignedTx(createChainTx, inputUTXOs, addressMaps);
};

export type NewAddSubnetValidatorTxProps = TxProps<{
  end: bigint;
  nodeId: string;
  start: bigint;
  /**
   * Indices of subnet owners.
   */
  subnetAuth: readonly number[];
  /**
   * ID of the subnet (Avalanche L1) that validates this chain.
   */
  subnetId: string;
  weight: bigint;
}>;

/**
 * Creates a new unsigned PVM add subnet validator transaction
 * (`AddSubnetValidatorTx`) using calculated dynamic fees.
 *
 * @param props
 * @param context
 * @returns An UnsignedTx.
 */
export const newAddSubnetValidatorTx: TxBuilderFn<
  NewAddSubnetValidatorTxProps
> = (
  {
    changeAddressesBytes,
    end,
    feeState,
    fromAddressesBytes,
    nodeId,
    memo = new Uint8Array(),
    minIssuanceTime = getDefaultMinIssuanceTime(),
    start,
    subnetAuth,
    subnetId,
    utxos,
    weight,
  },
  context,
) => {
  const memoComplexity = getBytesComplexity(memo);

  const authComplexity = getAuthComplexity(Input.fromNative(subnetAuth));

  const complexity = addDimensions(
    INTRINSIC_ADD_SUBNET_VALIDATOR_TX_COMPLEXITIES,
    memoComplexity,
    authComplexity,
  );

  const spendResults = spend(
    {
      changeOutputOwners: getChangeOutputOwners({
        changeAddressesBytes,
        fromAddressesBytes,
      }),
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      minIssuanceTime,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime,
    fromAddressesBytes,
  });

  const addSubnetValidatorTx = new AddSubnetValidatorTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      memo,
    ),
    SubnetValidator.fromNative(
      nodeId,
      start,
      end,
      weight,
      Id.fromString(subnetId),
    ),
    Input.fromNative(subnetAuth),
  );

  return new UnsignedTx(addSubnetValidatorTx, inputUTXOs, addressMaps);
};

export type NewRemoveSubnetValidatorTxProps = TxProps<{
  nodeId: string;
  /**
   * Indices of subnet owners.
   */
  subnetAuth: readonly number[];
  /**
   * ID of the subnet (Avalanche L1) that validates this chain.
   */
  subnetId: string;
}>;

/**
 * Creates a new unsigned PVM remove subnet validator transaction
 * (`RemoveSubnetValidatorTx`) using calculated dynamic fees.
 *
 * @param props
 * @param context
 * @returns An UnsignedTx.
 */
export const newRemoveSubnetValidatorTx: TxBuilderFn<
  NewRemoveSubnetValidatorTxProps
> = (
  {
    changeAddressesBytes,
    fromAddressesBytes,
    feeState,
    nodeId,
    memo = new Uint8Array(),
    minIssuanceTime = getDefaultMinIssuanceTime(),
    subnetAuth,
    subnetId,
    utxos,
  },
  context,
) => {
  const memoComplexity = getBytesComplexity(memo);

  const authComplexity = getAuthComplexity(Input.fromNative(subnetAuth));

  const complexity = addDimensions(
    INTRINSIC_REMOVE_SUBNET_VALIDATOR_TX_COMPLEXITIES,
    memoComplexity,
    authComplexity,
  );

  const spendResults = spend(
    {
      changeOutputOwners: getChangeOutputOwners({
        changeAddressesBytes,
        fromAddressesBytes,
      }),
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      minIssuanceTime,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime,
    fromAddressesBytes,
  });

  const removeSubnetValidatorTx = new RemoveSubnetValidatorTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      memo,
    ),
    NodeId.fromString(nodeId),
    Id.fromString(subnetId),
    Input.fromNative(subnetAuth),
  );

  return new UnsignedTx(removeSubnetValidatorTx, inputUTXOs, addressMaps);
};

export type NewAddPermissionlessValidatorTxProps = TxProps<{
  delegatorRewardsOwner: readonly Uint8Array[];
  /**
   * The Unix time based on p-chain timestamp when the validator
   * stops validating the Primary Network (and staked AVAX is returned).
   */
  end: bigint;
  /**
   * Optional. The number locktime field created in the resulting reward outputs.
   * @default 0n
   */
  locktime?: bigint;
  /**
   * The node ID of the validator being added.
   */
  nodeId: string;
  /**
   * The BLS public key.
   */
  publicKey?: Uint8Array;
  /**
   * The addresses which will receive the rewards from the delegated stake.
   * Given addresses will share the reward UTXO.
   */
  rewardAddresses: readonly Uint8Array[];
  /**
   * A number for the percentage times 10,000 of reward to be given to the
   * validator when someone delegates to them.
   */
  shares: number;
  /**
   * The BLS signature.
   */
  signature?: Uint8Array;
  /**
   * Which asset to stake. Defaults to AVAX.
   */
  stakingAssetId?: string;
  /**
   * The Unix time based on p-chain timestamp when the validator
   * starts validating the Primary Network.
   */
  start: bigint;
  /**
   * ID of the subnet (Avalanche L1) that validates this chain.
   */
  subnetId: string;
  /**
   * Optional. The number of signatures required to spend the funds in the
   * resultant reward UTXO.
   *
   * @default 1
   */
  threshold?: number;
  /**
   * The amount being locked for validation in nAVAX.
   */
  weight: bigint;
}>;

/**
 * Creates a new unsigned PVM add permissionless validator transaction
 * (`AddPermissionlessValidatorTx`) using calculated dynamic fees.
 *
 * @param props
 * @param context
 * @returns An UnsignedTx.
 */
export const newAddPermissionlessValidatorTx: TxBuilderFn<
  NewAddPermissionlessValidatorTxProps
> = (
  {
    changeAddressesBytes,
    delegatorRewardsOwner,
    end,
    feeState,
    fromAddressesBytes,
    locktime = 0n,
    nodeId,
    memo = new Uint8Array(),
    minIssuanceTime = getDefaultMinIssuanceTime(),
    publicKey,
    rewardAddresses,
    shares,
    signature,
    stakingAssetId,
    start,
    subnetId,
    threshold = 1,
    utxos,
    weight,
  },
  context,
) => {
  const isPrimaryNetwork = subnetId === PrimaryNetworkID.toString();

  const assetId = stakingAssetId ?? context.avaxAssetID;

  // Check if we use correct asset if on primary network
  if (isPrimaryNetwork && assetId !== context.avaxAssetID)
    throw new Error('Staking asset ID must be AVAX for the primary network.');

  const toStake = new Map<string, bigint>([[assetId, weight]]);

  const signer = createSignerOrSignerEmptyFromStrings(publicKey, signature);
  const validatorOutputOwners = OutputOwners.fromNative(
    rewardAddresses,
    locktime,
    threshold,
  );
  const delegatorOutputOwners = OutputOwners.fromNative(
    delegatorRewardsOwner,
    0n,
  );

  const memoComplexity = getBytesComplexity(memo);

  const signerComplexity = getSignerComplexity(signer);
  const validatorOwnerComplexity = getOwnerComplexity(validatorOutputOwners);
  const delegatorOwnerComplexity = getOwnerComplexity(delegatorOutputOwners);

  const complexity = addDimensions(
    INTRINSIC_ADD_PERMISSIONLESS_VALIDATOR_TX_COMPLEXITIES,
    memoComplexity,
    signerComplexity,
    validatorOwnerComplexity,
    delegatorOwnerComplexity,
  );

  const spendResults = spend(
    {
      changeOutputOwners: getChangeOutputOwners({
        changeAddressesBytes,
        fromAddressesBytes,
      }),
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      minIssuanceTime,
      shouldConsolidateOutputs: true,
      toStake,
      utxos,
    },
    [useSpendableLockedUTXOs, useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs, stakeOutputs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime,
    fromAddressesBytes,
  });

  const validatorTx = new AddPermissionlessValidatorTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      memo,
    ),
    SubnetValidator.fromNative(
      nodeId,
      start,
      end,
      weight,
      Id.fromString(subnetId),
    ),
    signer,
    stakeOutputs,
    validatorOutputOwners,
    delegatorOutputOwners,
    new Int(shares),
  );
  return new UnsignedTx(validatorTx, inputUTXOs, addressMaps);
};

export type NewAddPermissionlessDelegatorTxProps = TxProps<{
  /**
   * The Unix time based on p-chain timestamp when the delegation stops
   * (and staked AVAX is returned).
   */
  end: bigint;
  /**
   * Optional. The number locktime field created in the resulting reward outputs.
   * @default 0n
   */
  locktime?: bigint;
  /**
   * The node ID of the validator being delegated to.
   */
  nodeId: string;
  /**
   * The addresses which will receive the rewards from the delegated stake.
   * Given addresses will share the reward UTXO.
   */
  rewardAddresses: readonly Uint8Array[];
  /**
   * Which asset to stake. Defaults to AVAX.
   */
  stakingAssetId?: string;
  /**
   * The Unix time based on p-chain timestamp when the delegation starts.
   */
  start: bigint;
  /**
   * ID of the subnet (Avalanche L1) being delegated to.
   */
  subnetId: string;
  /**
   * Optional. The number of signatures required to spend the funds in the
   * resultant reward UTXO.
   *
   * @default 1
   */
  threshold?: number;
  /**
   * The amount being delegated in nAVAX.
   */
  weight: bigint;
}>;

/**
 * Creates a new unsigned PVM add permissionless delegator transaction
 * (`AddPermissionlessDelegatorTx`) using calculated dynamic fees.
 *
 * @param props
 * @param context
 * @returns An UnsignedTx.
 */
export const newAddPermissionlessDelegatorTx: TxBuilderFn<
  NewAddPermissionlessDelegatorTxProps
> = (
  {
    changeAddressesBytes,
    end,
    feeState,
    fromAddressesBytes,
    locktime = 0n,
    nodeId,
    memo = new Uint8Array(),
    minIssuanceTime = getDefaultMinIssuanceTime(),
    rewardAddresses,
    stakingAssetId,
    start,
    subnetId,
    threshold = 1,
    utxos,
    weight,
  },
  context,
) => {
  const isPrimaryNetwork = subnetId === PrimaryNetworkID.toString();

  const assetId = stakingAssetId ?? context.avaxAssetID;

  // Check if we use correct asset if on primary network
  if (isPrimaryNetwork && assetId !== context.avaxAssetID)
    throw new Error('Staking asset ID must be AVAX for the primary network.');

  const toStake = new Map<string, bigint>([[assetId, weight]]);

  const delegatorRewardsOwner = OutputOwners.fromNative(
    rewardAddresses,
    locktime,
    threshold,
  );

  const memoComplexity = getBytesComplexity(memo);

  const ownerComplexity = getOwnerComplexity(delegatorRewardsOwner);

  const complexity = addDimensions(
    INTRINSIC_ADD_PERMISSIONLESS_DELEGATOR_TX_COMPLEXITIES,
    memoComplexity,
    ownerComplexity,
  );

  const spendResults = spend(
    {
      changeOutputOwners: getChangeOutputOwners({
        changeAddressesBytes,
        fromAddressesBytes,
      }),
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      minIssuanceTime,
      shouldConsolidateOutputs: true,
      toStake,
      utxos,
    },
    [useSpendableLockedUTXOs, useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs, stakeOutputs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime,
    fromAddressesBytes,
  });

  const delegatorTx = new AddPermissionlessDelegatorTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      memo,
    ),
    SubnetValidator.fromNative(
      nodeId,
      start,
      end,
      weight,
      Id.fromString(subnetId),
    ),
    stakeOutputs,
    delegatorRewardsOwner,
  );

  return new UnsignedTx(delegatorTx, inputUTXOs, addressMaps);
};

export type NewTransferSubnetOwnershipTxProps = TxProps<{
  /**
   * Optional. The number locktime field created in the resulting reward outputs.
   * @default 0n
   */
  locktime?: bigint;
  /**
   * Indices of existing subnet owners.
   */
  subnetAuth: readonly number[];
  /**
   * ID of the subnet (Avalanche L1).
   */
  subnetId: string;
  /**
   * The new owner(s) addresses.
   */
  subnetOwners: readonly Uint8Array[];
  /**
   * Optional. The number of signatures required to spend the funds in the
   * resultant reward UTXO.
   *
   * @default 1
   */
  threshold?: number;
}>;

/**
 * Creates a new unsigned PVM transfer subnet ownership transaction
 * (`TransferSubnetOwnershipTx`) using calculated dynamic fees.
 *
 * @param props
 * @param context
 * @returns An UnsignedTx.
 */
export const newTransferSubnetOwnershipTx: TxBuilderFn<
  NewTransferSubnetOwnershipTxProps
> = (
  {
    changeAddressesBytes,
    fromAddressesBytes,
    feeState,
    locktime = 0n,
    memo = new Uint8Array(),
    minIssuanceTime = getDefaultMinIssuanceTime(),
    subnetAuth,
    subnetId,
    subnetOwners,
    threshold = 1,
    utxos,
  },
  context,
) => {
  const memoComplexity = getBytesComplexity(memo);

  const authComplexity = getAuthComplexity(Input.fromNative(subnetAuth));

  const ownerComplexity = getOwnerComplexity(
    OutputOwners.fromNative(subnetOwners, locktime, threshold),
  );

  const complexity = addDimensions(
    INTRINSIC_TRANSFER_SUBNET_OWNERSHIP_TX_COMPLEXITIES,
    memoComplexity,
    authComplexity,
    ownerComplexity,
  );

  const spendResults = spend(
    {
      changeOutputOwners: getChangeOutputOwners({
        changeAddressesBytes,
        fromAddressesBytes,
      }),
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      minIssuanceTime,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime,
    fromAddressesBytes,
  });

  return new UnsignedTx(
    new TransferSubnetOwnershipTx(
      AvaxBaseTx.fromNative(
        context.networkID,
        context.pBlockchainID,
        changeOutputs,
        inputs,
        memo,
      ),
      Id.fromString(subnetId),
      Input.fromNative(subnetAuth),
      OutputOwners.fromNative(subnetOwners, locktime, threshold),
    ),
    inputUTXOs,
    addressMaps,
  );
};

export type NewConvertSubnetToL1TxProps = TxProps<{
  /**
   * Specifies which chain the manager is deployed on
   */
  chainId: string;
  /**
   * Specifies the subnet to be converted
   */
  subnetId: string;
  /**
   * Specifies the address of the validator manager
   */
  address: Uint8Array;
  /**
   * Initial continuous-fee-paying validators for the L1
   */
  validators: L1Validator[];
  /**
   * Indices of existing subnet owners.
   */
  subnetAuth: readonly number[];
}>;

/**
 * Creates a new unsigned PVM convert subnet to L1 transaction
 * (`ConvertSubnetToL1Tx`) using calculated dynamic fees.
 *
 * @param props
 * @param context
 * @returns An UnsignedTx.
 */
export const newConvertSubnetToL1Tx: TxBuilderFn<
  NewConvertSubnetToL1TxProps
> = (
  {
    address,
    chainId,
    changeAddressesBytes,
    feeState,
    fromAddressesBytes,
    memo = new Uint8Array(),
    minIssuanceTime = BigInt(Math.floor(new Date().getTime() / 1000)),
    subnetAuth,
    subnetId,
    utxos,
    validators,
  },
  context,
) => {
  if (validators.find((validator) => validator.getWeight() <= 0n)) {
    throw new Error('Validator weight must be greater than 0');
  }

  const bytesComplexity = getBytesComplexity(memo, address);
  const authComplexity = getAuthComplexity(Input.fromNative(subnetAuth));
  const validatorComplexity = getL1ValidatorsComplexity(validators);

  const sortedValidators = validators.sort((a, b) =>
    bytesCompare(a.nodeId.toBytes(), b.nodeId.toBytes()),
  );

  const toBurn = new Map<string, bigint>();
  for (const validator of sortedValidators) {
    toBurn.set(
      context.avaxAssetID,
      (toBurn.get(context.avaxAssetID) ?? 0n) + validator.getBalance().value(),
    );
  }

  const complexity = addDimensions(
    INTRINSIC_CONVERT_SUBNET_TO_L1_TX_COMPLEXITIES,
    bytesComplexity,
    validatorComplexity,
    authComplexity,
  );

  const spendResults = spend(
    {
      changeOutputOwners: getChangeOutputOwners({
        changeAddressesBytes,
        fromAddressesBytes,
      }),
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      minIssuanceTime,
      toBurn,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime,
    fromAddressesBytes,
  });

  return new UnsignedTx(
    new ConvertSubnetToL1Tx(
      AvaxBaseTx.fromNative(
        context.networkID,
        context.pBlockchainID,
        changeOutputs,
        inputs,
        memo,
      ),
      Id.fromString(subnetId),
      Id.fromString(chainId),
      new Bytes(address),
      sortedValidators,
      Input.fromNative(subnetAuth),
    ),
    inputUTXOs,
    addressMaps,
  );
};

export type NewRegisterL1ValidatorTx = TxProps<{
  /**
   * Must be less than or equal to the sum of the AVAX inputs minus
   * the sum of the AVAX outputs minus the fee.
   */
  balance: bigint;
  /**
   * A BLS signature proving ownership of the BLS public key specified in the
   * `message` for this validator.
   */
  blsSignature: Uint8Array;
  /**
   * Warp message bytes.
   *
   * Expected to be a signed Warp message containing an AddressedCall payload
   * with the RegisterL1ValidatorMessage.
   */
  message: Uint8Array;
}>;

/**
 * Creates a new unsigned PVM register L1 validator transaction
 * (`RegisterL1ValidatorTx`) using calculated dynamic fees.
 *
 * @param props
 * @param context
 * @returns An UnsignedTx.
 */
export const newRegisterL1ValidatorTx: TxBuilderFn<NewRegisterL1ValidatorTx> = (
  {
    balance,
    blsSignature,
    changeAddressesBytes,
    feeState,
    fromAddressesBytes,
    memo = new Uint8Array(),
    message,
    minIssuanceTime = BigInt(Math.floor(new Date().getTime() / 1000)),
    utxos,
  },
  context,
) => {
  const messageBytes = new Bytes(message);

  const toBurn = new Map<string, bigint>([[context.avaxAssetID, balance]]);

  const bytesComplexity = getBytesComplexity(memo);
  const warpComplexity = getWarpComplexity(messageBytes);

  const complexity = addDimensions(
    INTRINSIC_REGISTER_L1_VALIDATOR_TX_COMPLEXITIES,
    bytesComplexity,
    warpComplexity,
  );

  const spendResults = spend(
    {
      changeOutputOwners: getChangeOutputOwners({
        changeAddressesBytes,
        fromAddressesBytes,
      }),
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      minIssuanceTime,
      toBurn,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime,
    fromAddressesBytes,
  });

  return new UnsignedTx(
    new RegisterL1ValidatorTx(
      AvaxBaseTx.fromNative(
        context.networkID,
        context.pBlockchainID,
        changeOutputs,
        inputs,
        memo,
      ),
      new BigIntPr(balance),
      BlsSignature.fromSignatureBytes(blsSignature),
      messageBytes,
    ),
    inputUTXOs,
    addressMaps,
  );
};

export type SetL1ValidatorWeightTxProps = TxProps<{
  /**
   * Warp message bytes.
   *
   * A L1ValidatorWeightMessage payload.
   */
  message: Uint8Array;
}>;

/**
 * Creates a new unsigned PVM set L1 validator weight transaction
 * (`SetL1ValidatorWeightTx`) using calculated dynamic fees.
 *
 * @param props
 * @param context
 * @returns An UnsignedTx.
 */
export const newSetL1ValidatorWeightTx: TxBuilderFn<
  SetL1ValidatorWeightTxProps
> = (
  {
    changeAddressesBytes,
    feeState,
    fromAddressesBytes,
    memo = new Uint8Array(),
    message,
    minIssuanceTime = BigInt(Math.floor(new Date().getTime() / 1000)),
    utxos,
  },
  context,
) => {
  const messageBytes = new Bytes(message);

  const memoComplexity = getBytesComplexity(memo);
  const warpComplexity = getWarpComplexity(messageBytes);

  const complexity = addDimensions(
    INTRINSIC_SET_L1_VALIDATOR_WEIGHT_TX_COMPLEXITIES,
    memoComplexity,
    warpComplexity,
  );

  const spendResults = spend(
    {
      changeOutputOwners: getChangeOutputOwners({
        changeAddressesBytes,
        fromAddressesBytes,
      }),
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      minIssuanceTime,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime,
    fromAddressesBytes,
  });

  return new UnsignedTx(
    new SetL1ValidatorWeightTx(
      AvaxBaseTx.fromNative(
        context.networkID,
        context.pBlockchainID,
        changeOutputs,
        inputs,
        memo,
      ),
      messageBytes,
    ),
    inputUTXOs,
    addressMaps,
  );
};

export type IncreaseL1ValidatorBalanceTxProps = TxProps<{
  /**
   * Amount to increase the balance by.
   *
   * Must be greater than 0.
   */
  balance: bigint;
  /**
   * ID corresponding to the validator
   */
  validationId: string;
}>;

/**
 * Creates a new unsigned PVM increase L1 validator balance transaction
 * (`IncreaseL1ValidatorBalanceTx`) using calculated dynamic fees.
 *
 * @param props
 * @param context
 * @returns An UnsignedTx.
 */
export const newIncreaseL1ValidatorBalanceTx: TxBuilderFn<
  IncreaseL1ValidatorBalanceTxProps
> = (
  {
    balance,
    changeAddressesBytes,
    feeState,
    fromAddressesBytes,
    memo = new Uint8Array(),
    minIssuanceTime = BigInt(Math.floor(new Date().getTime() / 1000)),
    utxos,
    validationId,
  },
  context,
) => {
  if (balance <= 0n) {
    throw new Error('Balance must be greater than 0');
  }

  const toBurn = new Map<string, bigint>([[context.avaxAssetID, balance]]);

  const bytesComplexity = getBytesComplexity(memo);

  const complexity = addDimensions(
    INTRINSIC_INCREASE_L1_VALIDATOR_BALANCE_TX_COMPLEXITIES,
    bytesComplexity,
  );

  const spendResults = spend(
    {
      changeOutputOwners: getChangeOutputOwners({
        changeAddressesBytes,
        fromAddressesBytes,
      }),
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      minIssuanceTime,
      toBurn,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;

  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime,
    fromAddressesBytes,
  });

  return new UnsignedTx(
    new IncreaseL1ValidatorBalanceTx(
      AvaxBaseTx.fromNative(
        context.networkID,
        context.pBlockchainID,
        changeOutputs,
        inputs,
        memo,
      ),
      Id.fromString(validationId),
      new BigIntPr(balance),
    ),
    inputUTXOs,
    addressMaps,
  );
};

export type DisableL1ValidatorTxProps = TxProps<{
  /**
   * Indices of owners.
   */
  disableAuth: readonly number[];
  /**
   * ID corresponding to the validator
   */
  validationId: string;
}>;

/**
 * Creates a new unsigned PVM disable subnet validator transaction
 * (`DisableL1ValidatorTx`) using calculated dynamic fees.
 *
 * @param props
 * @param context
 * @returns An UnsignedTx.
 */
export const newDisableL1ValidatorTx: TxBuilderFn<DisableL1ValidatorTxProps> = (
  {
    changeAddressesBytes,
    disableAuth,
    feeState,
    fromAddressesBytes,
    memo = new Uint8Array(),
    minIssuanceTime = BigInt(Math.floor(new Date().getTime() / 1000)),
    utxos,
    validationId,
  },
  context,
) => {
  const disableAuthInput = Input.fromNative(disableAuth);

  const bytesComplexity = getBytesComplexity(memo);
  const authComplexity = getAuthComplexity(disableAuthInput);

  const complexity = addDimensions(
    INTRINSIC_DISABLE_L1_VALIDATOR_TX_COMPLEXITIES,
    bytesComplexity,
    authComplexity,
  );

  const spendResults = spend(
    {
      changeOutputOwners: getChangeOutputOwners({
        changeAddressesBytes,
        fromAddressesBytes,
      }),
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      minIssuanceTime,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;

  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime,
    fromAddressesBytes,
  });

  return new UnsignedTx(
    new DisableL1ValidatorTx(
      AvaxBaseTx.fromNative(
        context.networkID,
        context.pBlockchainID,
        changeOutputs,
        inputs,
        memo,
      ),
      Id.fromString(validationId),
      disableAuthInput,
    ),
    inputUTXOs,
    addressMaps,
  );
};
