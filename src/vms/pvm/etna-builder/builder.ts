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
} from '../../../serializable/pvm';
import { createSignerOrSignerEmptyFromStrings } from '../../../serializable/pvm/signer';
import { AddressMaps, addressesFromBytes, isTransferOut } from '../../../utils';
import { matchOwners } from '../../../utils/matchOwners';
import { compareTransferableOutputs } from '../../../utils/sort';
import { baseTxUnsafePvm, type SpendOptions, UnsignedTx } from '../../common';
import { defaultSpendOptions } from '../../common/defaultSpendOptions';
import type { Dimensions } from '../../common/fees/dimensions';
import { addDimensions, createDimensions } from '../../common/fees/dimensions';
import type { Context } from '../../context';
import type { FeeState } from '../models';
import {
  INTRINSIC_ADD_PERMISSIONLESS_DELEGATOR_TX_COMPLEXITIES,
  INTRINSIC_ADD_PERMISSIONLESS_VALIDATOR_TX_COMPLEXITIES,
  INTRINSIC_ADD_SUBNET_VALIDATOR_TX_COMPLEXITIES,
  INTRINSIC_BASE_TX_COMPLEXITIES,
  INTRINSIC_CREATE_CHAIN_TX_COMPLEXITIES,
  INTRINSIC_CREATE_SUBNET_TX_COMPLEXITIES,
  INTRINSIC_EXPORT_TX_COMPLEXITIES,
  INTRINSIC_IMPORT_TX_COMPLEXITIES,
  INTRINSIC_REMOVE_SUBNET_VALIDATOR_TX_COMPLEXITIES,
  INTRINSIC_TRANSFER_SUBNET_OWNERSHIP_TX_COMPLEXITIES,
  getAuthComplexity,
  getInputComplexity,
  getOutputComplexity,
  getOwnerComplexity,
  getSignerComplexity,
} from '../txs/fee';
import { spend } from './spend';
import { useSpendableLockedUTXOs, useUnlockedUTXOs } from './spend-reducers';

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

const getMemoComplexity = (
  spendOptions: Required<SpendOptions>,
): Dimensions => {
  return createDimensions({
    bandwidth: spendOptions.memo.length,
    dbRead: 0,
    dbWrite: 0,
    compute: 0,
  });
};

/**
 * Common properties used in all PVM transaction builder functions.
 */
type CommonTxProps = Readonly<{
  feeState: FeeState;
  /**
   * List of addresses that are used for selecting which UTXOs are signable.
   */
  fromAddressesBytes: readonly Uint8Array[];
  options?: SpendOptions;
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
 * @param props {NewBaseTxProps}
 * @param context {Context}
 * @returns {UnsignedTx} An UnsignedTx.
 */
export const newBaseTx: TxBuilderFn<NewBaseTxProps> = (
  { feeState, fromAddressesBytes, options, outputs, utxos },
  context,
) => {
  const fromAddresses = addressesFromBytes(fromAddressesBytes);
  const defaultedOptions = defaultSpendOptions(
    [...fromAddressesBytes],
    options,
  );
  const toBurn = new Map<string, bigint>();

  outputs.forEach((out) => {
    const assetId = out.assetId.value();
    const amountToBurn = (toBurn.get(assetId) ?? 0n) + out.amount();

    toBurn.set(assetId, amountToBurn);
  });

  const memoComplexity = getMemoComplexity(defaultedOptions);

  const outputComplexity = getOutputComplexity(outputs);

  const complexity = addDimensions(
    INTRINSIC_BASE_TX_COMPLEXITIES,
    memoComplexity,
    outputComplexity,
  );

  const spendResults = spend(
    {
      excessAVAX: 0n,
      feeState,
      fromAddresses,
      initialComplexity: complexity,
      shouldConsolidateOutputs: true,
      spendOptions: defaultedOptions,
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
    minIssuanceTime: defaultedOptions.minIssuanceTime,
    fromAddressesBytes,
  });

  const allOutputs = [...outputs, ...changeOutputs].sort(
    compareTransferableOutputs,
  );

  return new UnsignedTx(
    new BaseTx(
      baseTxUnsafePvm(context, allOutputs, inputs, defaultedOptions.memo),
    ),
    inputUTXOs,
    addressMaps,
  );
};

export type NewImportTxProps = TxProps<{
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
  toAddresses: readonly Uint8Array[];
}>;

/**
 * Creates a new unsigned PVM import transaction (`ImportTx`) using calculated dynamic fees.
 *
 * @param props {NewImportTxProps}
 * @param context {Context}
 * @returns {UnsignedTx} An UnsignedTx.
 */
export const newImportTx: TxBuilderFn<NewImportTxProps> = (
  {
    feeState,
    fromAddressesBytes,
    locktime,
    options,
    sourceChainId,
    threshold,
    toAddresses,
    utxos,
  },
  context,
) => {
  const fromAddresses = addressesFromBytes(fromAddressesBytes);
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);

  const { importedInputs, importedAmounts } = utxos
    .filter(
      (utxo): utxo is Utxo<TransferOutput> =>
        isTransferOut(utxo.output) &&
        // Currently - only AVAX is allowed to be imported to the P-Chain
        utxo.assetId.toString() === context.avaxAssetID,
    )
    .reduce<{
      importedInputs: TransferableInput[];
      importedAmounts: Record<string, bigint>;
    }>(
      (acc, utxo) => {
        const { sigIndicies: inputSigIndices } =
          matchOwners(
            utxo.getOutputOwners(),
            fromAddresses,
            defaultedOptions.minIssuanceTime,
          ) || {};

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
        };
      },
      { importedInputs: [], importedAmounts: {} },
    );

  if (importedInputs.length === 0) {
    throw new Error('no UTXOs available to import');
  }

  const importedAvax = importedAmounts[context.avaxAssetID];

  const addressMaps = AddressMaps.fromTransferableInputs(
    importedInputs,
    utxos,
    defaultedOptions.minIssuanceTime,
    fromAddressesBytes,
  );

  const outputs: TransferableOutput[] = Object.entries(importedAmounts)
    .filter(([assetID]) => assetID !== context.avaxAssetID)
    .map(([assetID, amount]) =>
      TransferableOutput.fromNative(
        assetID,
        amount,
        toAddresses,
        locktime,
        threshold,
      ),
    );

  const memoComplexity = getMemoComplexity(defaultedOptions);

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
      excessAVAX: importedAvax,
      feeState,
      fromAddresses,
      initialComplexity: complexity,
      ownerOverride: OutputOwners.fromNative(toAddresses, locktime, threshold),
      spendOptions: defaultedOptions,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;

  return new UnsignedTx(
    new ImportTx(
      new AvaxBaseTx(
        new Int(context.networkID),
        PlatformChainID,
        [...outputs, ...changeOutputs].sort(compareTransferableOutputs),
        inputs,
        new Bytes(defaultedOptions.memo),
      ),
      Id.fromString(sourceChainId),
      importedInputs.sort(TransferableInput.compare),
    ),
    inputUTXOs,
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
 * @param props {NewExportTxProps}
 * @param context {Context}
 * @returns {UnsignedTx} An UnsignedTx.
 */
export const newExportTx: TxBuilderFn<NewExportTxProps> = (
  { destinationChainId, feeState, fromAddressesBytes, options, outputs, utxos },
  context,
) => {
  const fromAddresses = addressesFromBytes(fromAddressesBytes);

  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
  const toBurn = new Map<string, bigint>();

  outputs.forEach((output) => {
    const assetId = output.assetId.value();
    toBurn.set(assetId, (toBurn.get(assetId) ?? 0n) + output.output.amount());
  });

  const memoComplexity = getMemoComplexity(defaultedOptions);

  const outputComplexity = getOutputComplexity(outputs);

  const complexity = addDimensions(
    INTRINSIC_EXPORT_TX_COMPLEXITIES,
    memoComplexity,
    outputComplexity,
  );

  const spendResults = spend(
    {
      excessAVAX: 0n,
      feeState,
      fromAddresses,
      initialComplexity: complexity,
      spendOptions: defaultedOptions,
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
    minIssuanceTime: defaultedOptions.minIssuanceTime,
    fromAddressesBytes,
  });

  return new UnsignedTx(
    new ExportTx(
      new AvaxBaseTx(
        new Int(context.networkID),
        PlatformChainID,
        changeOutputs,
        inputs,
        new Bytes(defaultedOptions.memo),
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
 * @param props {NewCreateSubnetTxProps}
 * @param context {Context}
 * @returns {UnsignedTx} An UnsignedTx.
 */
export const newCreateSubnetTx: TxBuilderFn<NewCreateSubnetTxProps> = (
  {
    fromAddressesBytes,
    feeState,
    locktime,
    options,
    subnetOwners,
    threshold,
    utxos,
  },
  context,
) => {
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);

  const memoComplexity = getMemoComplexity(defaultedOptions);

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
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      spendOptions: defaultedOptions,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime: defaultedOptions.minIssuanceTime,
    fromAddressesBytes,
  });

  const createSubnetTx = new CreateSubnetTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      defaultedOptions.memo,
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
 * @param props {NewCreateChainTxProps}
 * @param context {Context}
 * @returns {UnsignedTx} An UnsignedTx.
 */
export const newCreateChainTx: TxBuilderFn<NewCreateChainTxProps> = (
  {
    chainName,
    feeState,
    fromAddressesBytes,
    fxIds,
    genesisData,
    options,
    subnetAuth,
    subnetId,
    utxos,
    vmId,
  },
  context,
) => {
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);

  const genesisBytes = new Bytes(
    new TextEncoder().encode(JSON.stringify(genesisData)),
  );

  const subnetAuthInput = Input.fromNative(subnetAuth);

  const dynamicComplexity = createDimensions({
    bandwidth:
      fxIds.length * ID_LEN +
      chainName.length +
      genesisBytes.length +
      defaultedOptions.memo.length,
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
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      spendOptions: defaultedOptions,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime: defaultedOptions.minIssuanceTime,
    fromAddressesBytes,
  });

  const createChainTx = new CreateChainTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      defaultedOptions.memo,
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
 * @param props {NewAddSubnetValidatorTxProps}
 * @param context {Context}
 * @returns {UnsignedTx} An UnsignedTx.
 */
export const newAddSubnetValidatorTx: TxBuilderFn<
  NewAddSubnetValidatorTxProps
> = (
  {
    end,
    feeState,
    fromAddressesBytes,
    nodeId,
    options,
    start,
    subnetAuth,
    subnetId,
    utxos,
    weight,
  },
  context,
) => {
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);

  const memoComplexity = getMemoComplexity(defaultedOptions);

  const authComplexity = getAuthComplexity(Input.fromNative(subnetAuth));

  const complexity = addDimensions(
    INTRINSIC_ADD_SUBNET_VALIDATOR_TX_COMPLEXITIES,
    memoComplexity,
    authComplexity,
  );

  const spendResults = spend(
    {
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      spendOptions: defaultedOptions,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime: defaultedOptions.minIssuanceTime,
    fromAddressesBytes,
  });

  const addSubnetValidatorTx = new AddSubnetValidatorTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      defaultedOptions.memo,
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
 * @param props {NewRemoveSubnetValidatorTxProps}
 * @param context {Context}
 * @returns {UnsignedTx} An UnsignedTx.
 */
export const newRemoveSubnetValidatorTx: TxBuilderFn<
  NewRemoveSubnetValidatorTxProps
> = (
  {
    fromAddressesBytes,
    feeState,
    nodeId,
    options,
    subnetAuth,
    subnetId,
    utxos,
  },
  context,
) => {
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);

  const memoComplexity = getMemoComplexity(defaultedOptions);

  const authComplexity = getAuthComplexity(Input.fromNative(subnetAuth));

  const complexity = addDimensions(
    INTRINSIC_REMOVE_SUBNET_VALIDATOR_TX_COMPLEXITIES,
    memoComplexity,
    authComplexity,
  );

  const spendResults = spend(
    {
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      spendOptions: defaultedOptions,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime: defaultedOptions.minIssuanceTime,
    fromAddressesBytes,
  });

  const removeSubnetValidatorTx = new RemoveSubnetValidatorTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      defaultedOptions.memo,
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
  publicKey: Uint8Array;
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
  signature: Uint8Array;
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
 * @param props {NewAddPermissionlessValidatorTxProps}
 * @param context {Context}
 * @returns {UnsignedTx} An UnsignedTx.
 */
export const newAddPermissionlessValidatorTx: TxBuilderFn<
  NewAddPermissionlessValidatorTxProps
> = (
  {
    delegatorRewardsOwner,
    end,
    feeState,
    fromAddressesBytes,
    locktime = 0n,
    nodeId,
    options,
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

  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);

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

  const memoComplexity = getMemoComplexity(defaultedOptions);

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
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      shouldConsolidateOutputs: true,
      spendOptions: defaultedOptions,
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
    minIssuanceTime: defaultedOptions.minIssuanceTime,
    fromAddressesBytes,
  });

  const validatorTx = new AddPermissionlessValidatorTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      defaultedOptions.memo,
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
 * @param props {NewAddPermissionlessDelegatorTxProps}
 * @param context {Context}
 * @returns {UnsignedTx} An UnsignedTx.
 */
export const newAddPermissionlessDelegatorTx: TxBuilderFn<
  NewAddPermissionlessDelegatorTxProps
> = (
  {
    end,
    feeState,
    fromAddressesBytes,
    locktime = 0n,
    nodeId,
    options,
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

  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);

  const delegatorRewardsOwner = OutputOwners.fromNative(
    rewardAddresses,
    locktime,
    threshold,
  );

  const memoComplexity = getMemoComplexity(defaultedOptions);

  const ownerComplexity = getOwnerComplexity(delegatorRewardsOwner);

  const complexity = addDimensions(
    INTRINSIC_ADD_PERMISSIONLESS_DELEGATOR_TX_COMPLEXITIES,
    memoComplexity,
    ownerComplexity,
  );

  const spendResults = spend(
    {
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      shouldConsolidateOutputs: true,
      spendOptions: defaultedOptions,
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
    minIssuanceTime: defaultedOptions.minIssuanceTime,
    fromAddressesBytes,
  });

  const delegatorTx = new AddPermissionlessDelegatorTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      defaultedOptions.memo,
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
 * @param props {NewTransferSubnetOwnershipTxProps}
 * @param context {Context}
 * @returns {UnsignedTx} An UnsignedTx.
 */
export const newTransferSubnetOwnershipTx: TxBuilderFn<
  NewTransferSubnetOwnershipTxProps
> = (
  {
    fromAddressesBytes,
    feeState,
    locktime = 0n,
    options,
    subnetAuth,
    subnetId,
    subnetOwners,
    threshold = 1,
    utxos,
  },
  context,
) => {
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);

  const memoComplexity = getMemoComplexity(defaultedOptions);

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
      excessAVAX: 0n,
      feeState,
      fromAddresses: addressesFromBytes(fromAddressesBytes),
      initialComplexity: complexity,
      spendOptions: defaultedOptions,
      utxos,
    },
    [useUnlockedUTXOs],
    context,
  );

  const { changeOutputs, inputs, inputUTXOs } = spendResults;
  const addressMaps = getAddressMaps({
    inputs,
    inputUTXOs,
    minIssuanceTime: defaultedOptions.minIssuanceTime,
    fromAddressesBytes,
  });

  return new UnsignedTx(
    new TransferSubnetOwnershipTx(
      AvaxBaseTx.fromNative(
        context.networkID,
        context.pBlockchainID,
        changeOutputs,
        inputs,
        defaultedOptions.memo,
      ),
      Id.fromString(subnetId),
      Input.fromNative(subnetAuth),
      OutputOwners.fromNative(subnetOwners, locktime, threshold),
    ),
    inputUTXOs,
    addressMaps,
  );
};
