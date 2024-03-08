import { PlatformChainID, PrimaryNetworkID } from '../../constants/networkIDs';
import {
  BaseTx as AvaxBaseTx,
  TransferableInput,
  TransferableOutput,
} from '../../serializable/avax';
import type { Utxo } from '../../serializable/avax/utxo';
import { Id } from '../../serializable/fxs/common';
import { Input, OutputOwners } from '../../serializable/fxs/secp256k1';
import { BigIntPr, Byte, Stringpr } from '../../serializable/primitives';
import { Bytes, Int } from '../../serializable/primitives';
import {
  AddDelegatorTx,
  AddValidatorTx,
  BaseTx,
  CreateChainTx,
  CreateSubnetTx,
  ExportTx,
  ImportTx,
  Validator,
  AddSubnetValidatorTx,
  SubnetValidator,
  AddPermissionlessValidatorTx,
  AddPermissionlessDelegatorTx,
  RemoveSubnetValidatorTx,
  TransferSubnetOwnershipTx,
  TransformSubnetTx,
} from '../../serializable/pvm';
import { addressesFromBytes, hexToBuffer } from '../../utils';
import { AddressMaps } from '../../utils/addressMap';
import { getImportedInputsFromUtxos } from '../../utils/builderUtils';
import { compareTransferableOutputs } from '../../utils/sort';
import { defaultSpendOptions } from '../common/defaultSpendOptions';
import type { SpendOptions } from '../common/models';
import { UnsignedTx } from '../common/unsignedTx';
import type { Context } from '../context';
import { calculateUTXOSpend } from '../utils/calculateSpend';
import {
  useConsolidateOutputs,
  useSpendableLockedUTXOs,
  useUnlockedUTXOs,
} from './utxoCalculationFns';
import { NodeId } from '../../serializable/fxs/common/nodeId';
import { createSignerOrSignerEmptyFromStrings } from '../../serializable/pvm/signer';
import { baseTxUnsafePvm } from '../common';

/*
  Builder is useful for building transactions that are specific to a chain.
 */

/**
 * @param fromAddresses - used for selecting which utxos are signable
 * @param utxoSet - list of utxos to spend from
 * @param outputs - the desired output (change outputs will be added to them automatically)
 * @param options - see SpendingOptions
 *
 * @returns UnsignedTx containing a BaseTx
 */
export function newBaseTx(
  context: Context,
  fromAddressesBytes: Uint8Array[],
  utxoSet: Utxo[],
  outputs: TransferableOutput[],
  options?: SpendOptions,
) {
  const fromAddresses = addressesFromBytes(fromAddressesBytes);
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
  const toBurn = new Map<string, bigint>([
    [context.avaxAssetID, context.baseTxFee],
  ]);

  outputs.forEach((out) => {
    const assetId = out.assetId.value();
    toBurn.set(assetId, (toBurn.get(assetId) || 0n) + out.output.amount());
  });

  const { inputs, inputUTXOs, changeOutputs, addressMaps } = calculateUTXOSpend(
    toBurn,
    undefined,
    utxoSet,
    fromAddresses,
    defaultedOptions,
    [useUnlockedUTXOs, useConsolidateOutputs],
  );

  const allOutputs = [...outputs, ...changeOutputs];
  allOutputs.sort(compareTransferableOutputs);

  return new UnsignedTx(
    new BaseTx(
      baseTxUnsafePvm(context, allOutputs, inputs, defaultedOptions.memo),
    ),
    inputUTXOs,
    addressMaps,
  );
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
export function newImportTx(
  context: Context,
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
    (utxo) => utxo.assetId.toString() === context.avaxAssetID,
  );

  const { importedAmounts, importedInputs, inputUTXOs } =
    getImportedInputsFromUtxos(
      utxos,
      fromAddressesBytes,
      defaultedOptions.minIssuanceTime,
    );

  const importedAvax = importedAmounts[context.avaxAssetID] ?? 0n;

  importedInputs.sort(TransferableInput.compare);
  const addressMaps = AddressMaps.fromTransferableInputs(
    importedInputs,
    utxos,
    defaultedOptions.minIssuanceTime,
    fromAddressesBytes,
  );
  if (!importedInputs.length) {
    throw new Error('no UTXOs available to import');
  }
  let inputs: TransferableInput[] = [];
  let changeOutputs: TransferableOutput[] = [];

  if (importedAvax < context.baseTxFee) {
    const toBurn = new Map<string, bigint>([
      [context.avaxAssetID, context.baseTxFee - importedAvax],
    ]);

    const spendRes = calculateUTXOSpend(
      toBurn,
      undefined,
      utxos,
      fromAddresses,
      defaultedOptions,
      [useUnlockedUTXOs],
    );
    inputs = spendRes.inputs;
    changeOutputs = spendRes.changeOutputs;
  } else if (importedAvax > context.baseTxFee) {
    changeOutputs.push(
      TransferableOutput.fromNative(
        context.avaxAssetID,
        importedAvax - context.baseTxFee,
        toAddresses,
        locktime,
        threshold,
      ),
    );
  }

  return new UnsignedTx(
    new ImportTx(
      new AvaxBaseTx(
        new Int(context.networkID),
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

const getToBurn = (
  context: Context,
  outputs: TransferableOutput[],
  baseFee: bigint,
) => {
  const toBurn = new Map<string, bigint>([[context.avaxAssetID, baseFee]]);

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
 * @deprecated since {@link https://github.com/avalanche-foundation/ACPs/blob/main/ACPs/62-disable-addvalidatortx-and-adddelegatortx.md|Durango-upgrade}
 *
 * @param utxos A list of UTXOs that the transaction is built on
 * @param fromAddresses An array of addresses as uint8Array who own the staking UTXOs the fees in AVAX
 * @param nodeID The node ID of the validator being added.
 * @param start The Unix time based on p-chain timestamp when the validator starts validating the Primary Network.
 * @param end The Unix time based on p-chain timestamp when the validator stops validating the Primary Network (and staked AVAX is returned).
 * @param weight The amount being delegated in nAVAX
 * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
 * @param shares A number for the percentage times 10,000 of reward to be given to the validator when someone delegates to them.
 * @param threshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
 * @param locktime Optional. The locktime field created in the resulting reward outputs
 *
 * @returns An unsigned transaction created from the passed in parameters.
 */
export function newAddValidatorTx(
  context: Context,
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
  const toBurn = new Map<string, bigint>([
    [context.avaxAssetID, context.addPrimaryNetworkValidatorFee],
  ]);
  const toStake = new Map<string, bigint>([[context.avaxAssetID, weight]]);

  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
  const { addressMaps, changeOutputs, inputUTXOs, inputs, stakeOutputs } =
    calculateUTXOSpend(
      toBurn,
      toStake,
      utxos,
      addressesFromBytes(fromAddressesBytes),
      defaultedOptions,
      [useSpendableLockedUTXOs, useUnlockedUTXOs, useConsolidateOutputs],
    );

  const validatorTx = new AddValidatorTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
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

export function newExportTx(
  context: Context,
  destinationChainID: string,
  fromAddressesBytes: Uint8Array[],
  utxos: Utxo[],
  outputs: TransferableOutput[],
  options?: SpendOptions,
) {
  const fromAddresses = addressesFromBytes(fromAddressesBytes);

  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
  const toBurn = getToBurn(context, outputs, context.baseTxFee);

  const { inputs, changeOutputs, addressMaps, inputUTXOs } = calculateUTXOSpend(
    toBurn,
    undefined,
    utxos,
    fromAddresses,
    defaultedOptions,
    [useUnlockedUTXOs],
  );

  outputs.sort(compareTransferableOutputs);
  return new UnsignedTx(
    new ExportTx(
      new AvaxBaseTx(
        new Int(context.networkID),
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
 * @deprecated since {@link https://github.com/avalanche-foundation/ACPs/blob/main/ACPs/62-disable-addvalidatortx-and-adddelegatortx.md|Durango-upgrade}
 *
 * @param utxos list of utxos to choose from
 * @param fromAddressesBytes used for filtering utxos
 * @param nodeID id of the node to delegate. starts with "NodeID-"
 * @param start The Unix time based on p-chain timestamp when the validator starts validating the Primary Network.
 * @param end The Unix time based on p-chain timestamp when the validator stops validating the Primary Network (and staked AVAX is returned).
 * @param weight The amount being delegated in nAVAX
 * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
 * @param options - used for filtering utxos
 * @param threshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
 * @param locktime Optional. The locktime field created in the resulting reward outputs
 * @returns UnsingedTx
 */

export function newAddDelegatorTx(
  context: Context,
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
  const toBurn = new Map<string, bigint>([
    [context.avaxAssetID, context.addPrimaryNetworkDelegatorFee],
  ]);
  const toStake = new Map<string, bigint>([[context.avaxAssetID, weight]]);

  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
  const { inputs, addressMaps, changeOutputs, inputUTXOs, stakeOutputs } =
    calculateUTXOSpend(
      toBurn,
      toStake,
      utxos,
      addressesFromBytes(fromAddressesBytes),
      defaultedOptions,
      [useSpendableLockedUTXOs, useUnlockedUTXOs, useConsolidateOutputs],
    );

  const addDelegatorTx = new AddDelegatorTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
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

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#unsigned-create-subnet-tx
 *
 * @param context
 * @param utxos list of utxos to choose from
 * @param fromAddressesBytes used for filtering utxos
 * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
 * @param options used for filtering utxos
 * @param threshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
 * @param locktime Optional. The locktime field created in the resulting reward outputs
 * @returns UnsingedTx
 */
export function newCreateSubnetTx(
  context: Context,
  utxos: Utxo[],
  fromAddressesBytes: Uint8Array[],
  subnetOwners: Uint8Array[],
  options?: SpendOptions,
  threshold = 1,
  locktime = 0n,
) {
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);

  const { inputs, addressMaps, changeOutputs, inputUTXOs } = calculateUTXOSpend(
    new Map([[context.avaxAssetID, context.createSubnetTxFee]]),
    undefined,
    utxos,
    addressesFromBytes(fromAddressesBytes),
    defaultedOptions,
    [useUnlockedUTXOs],
  );

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
}

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#unsigned-create-chain-tx
 *
 * @param context
 * @param utxos list of utxos to choose from
 * @param fromAddressesBytes used for filtering utxos
 * @param subnetID ID of the Subnet that validates this blockchain
 * @param chainName A human readable name for the chain; need not be unique
 * @param vmID ID of the VM running on the new chain
 * @param fxIds IDs of the feature extensions running on the new chain
 * @param genesisData json config for the genesis data
 * @param subnetAuth specifies indices of subnet owners
 * @param options used for filtering utxos
 * @returns UnsignedTx
 */
export function newCreateBlockchainTx(
  context: Context,
  utxos: Utxo[],
  fromAddressesBytes: Uint8Array[],
  subnetID: string,
  chainName: string,
  vmID: string,
  fxIds: string[],
  genesisData: Record<string, unknown>,
  subnetAuth: number[],
  options?: SpendOptions,
) {
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);

  const { inputs, addressMaps, changeOutputs, inputUTXOs } = calculateUTXOSpend(
    new Map([[context.avaxAssetID, context.createBlockchainTxFee]]),
    undefined,
    utxos,
    addressesFromBytes(fromAddressesBytes),
    defaultedOptions,
    [useUnlockedUTXOs],
  );

  const createChainTx = new CreateChainTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      defaultedOptions.memo,
    ),
    Id.fromString(subnetID),
    new Stringpr(chainName),
    Id.fromString(vmID),
    fxIds.map(Id.fromString.bind(Id)),
    new Bytes(new TextEncoder().encode(JSON.stringify(genesisData))),
    Input.fromNative(subnetAuth),
  );

  return new UnsignedTx(createChainTx, inputUTXOs, addressMaps);
}

export function newAddSubnetValidatorTx(
  context: Context,
  utxos: Utxo[],
  fromAddressesBytes: Uint8Array[],
  nodeId: string,
  start: bigint,
  end: bigint,
  weight: bigint,
  subnetID: string,
  subnetAuth: number[],
  options?: SpendOptions,
) {
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);

  const { inputs, addressMaps, changeOutputs, inputUTXOs } = calculateUTXOSpend(
    new Map([[context.avaxAssetID, context.addSubnetValidatorFee]]),
    undefined,
    utxos,
    addressesFromBytes(fromAddressesBytes),
    defaultedOptions,
    [useUnlockedUTXOs],
  );

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
      Id.fromString(subnetID),
    ),
    Input.fromNative(subnetAuth),
  );

  return new UnsignedTx(addSubnetValidatorTx, inputUTXOs, addressMaps);
}
export function newRemoveSubnetValidatorTx(
  context: Context,
  utxos: Utxo[],
  fromAddressesBytes: Uint8Array[],
  nodeId: string,
  subnetID: string,
  subnetAuth: number[],
  options?: SpendOptions,
) {
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);

  const { inputs, addressMaps, changeOutputs, inputUTXOs } = calculateUTXOSpend(
    new Map([[context.avaxAssetID, context.baseTxFee]]),
    undefined,
    utxos,
    addressesFromBytes(fromAddressesBytes),
    defaultedOptions,
    [useUnlockedUTXOs],
  );

  const removeSubnetValidatorTx = new RemoveSubnetValidatorTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      defaultedOptions.memo,
    ),
    NodeId.fromString(nodeId),
    Id.fromString(subnetID),
    Input.fromNative(subnetAuth),
  );

  return new UnsignedTx(removeSubnetValidatorTx, inputUTXOs, addressMaps);
}

/**
 * Helper function which creates an unsigned [[newAddPermissionlessValidatorTx]]. For more granular control, you may create your own
 * [[UnsignedTx]] manually and import the [[newAddPermissionlessValidatorTx]] class directly.
 *
 * @param utxos A list of UTXOs that the transaction is built on
 * @param fromAddresses An array of addresses as uint8Array who own the staking UTXOs the fees in AVAX
 * @param nodeID The node ID of the validator being added.
 * @param subnetID ID of the subnet this validator is validating
 * @param start The Unix time based on p-chain timestamp when the validator starts validating the Primary Network.
 * @param end The Unix time based on p-chain timestamp when the validator stops validating the Primary Network (and staked AVAX is returned).
 * @param weight The amount being locked for validation in nAVAX
 * @param rewardAddresses The addresses which will receive the rewards from the delegated stake. Given addresses will share the reward UTXO.
 * @param shares A number for the percentage times 10,000 of reward to be given to the validator when someone delegates to them.
 * @param threshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
 * @param locktime Optional. The locktime field created in the resulting reward outputs
 * @param publicKey the BLS public key, If the subnet is the primary network
 * @param signature the BLS signature, If the subnet is the primary network
 * @param stakingAssetId Which asset to stake. Defaults to AVAX.
 *
 * @returns An unsigned transaction created from the passed in parameters.
 */
export function newAddPermissionlessValidatorTx(
  context: Context,
  utxos: Utxo[],
  fromAddressesBytes: Uint8Array[],
  nodeID: string,
  subnetID: string,
  start: bigint,
  end: bigint,
  weight: bigint,
  rewardAddresses: Uint8Array[],
  delegatorRewardsOwner: Uint8Array[],
  shares: number,
  options?: SpendOptions,
  threshold = 1,
  locktime = 0n,
  publicKey?: Uint8Array,
  signature?: Uint8Array,
  stakingAssetId?: string,
) {
  const isPrimaryNetwork = subnetID === PrimaryNetworkID.toString();
  const fee = isPrimaryNetwork
    ? context.addPrimaryNetworkValidatorFee
    : context.addSubnetValidatorFee;
  const toBurn = new Map<string, bigint>([[context.avaxAssetID, fee]]);

  const assetId = stakingAssetId ?? context.avaxAssetID;

  // Check if we use correct asset if on primary network
  if (isPrimaryNetwork && assetId !== context.avaxAssetID)
    throw new Error('Staking asset ID must be AVAX for the primary network.');

  const toStake = new Map<string, bigint>([[assetId, weight]]);

  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
  const { addressMaps, changeOutputs, inputUTXOs, inputs, stakeOutputs } =
    calculateUTXOSpend(
      toBurn,
      toStake,
      utxos,
      addressesFromBytes(fromAddressesBytes),
      defaultedOptions,
      [useSpendableLockedUTXOs, useUnlockedUTXOs, useConsolidateOutputs],
    );

  const validatorTx = new AddPermissionlessValidatorTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      defaultedOptions.memo,
    ),
    SubnetValidator.fromNative(
      nodeID,
      start,
      end,
      weight,
      Id.fromString(subnetID),
    ),
    createSignerOrSignerEmptyFromStrings(publicKey, signature),
    stakeOutputs,
    OutputOwners.fromNative(rewardAddresses, locktime, threshold),
    OutputOwners.fromNative(delegatorRewardsOwner, 0n),
    new Int(shares),
  );
  return new UnsignedTx(validatorTx, inputUTXOs, addressMaps);
}

/**
 * Helper function which creates an unsigned [[newAddPermissionlessDelegatorTx]]. For more granular control, you may create your own
 * [[UnsignedTx]] manually and import the [[newAddPermissionlessDelegatorTx]] class directly.
 *
 * @param context The context for the network
 * @param utxos A list of UTXOs that the transaction is built on
 * @param fromAddressesBytes An array of addresses as uint8Array who own the staking UTXOs the fees in AVAX
 * @param nodeID The node ID of the validator being delegated to.
 * @param subnetID ID of the subnet being delegated to
 * @param start The Unix time based on p-chain timestamp when the delegation starts.
 * @param end The Unix time based on p-chain timestamp when the delegation stops (and staked AVAX is returned).
 * @param weight The amount being delegated in nAVAX
 * @param rewardAddresses The addresses which will receive the rewards from the delegated stake. Given addresses will share the reward UTXO.
 * @param threshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
 * @param locktime Optional. The locktime field created in the resulting reward outputs
 * @param options Optional. Config for the transaction such as change address, threshold and locktime.
 * @param stakingAssetId Optional. Which asset to stake. Defaults to AVAX.
 *
 * @returns An unsigned transaction created from the passed in parameters.
 */
export function newAddPermissionlessDelegatorTx(
  context: Context,
  utxos: Utxo[],
  fromAddressesBytes: Uint8Array[],
  nodeID: string,
  subnetID: string,
  start: bigint,
  end: bigint,
  weight: bigint,
  rewardAddresses: Uint8Array[],
  options?: SpendOptions,
  threshold = 1,
  locktime = 0n,
  stakingAssetId?: string,
) {
  const isPrimaryNetwork = subnetID === PrimaryNetworkID.toString();
  const fee = isPrimaryNetwork
    ? context.addPrimaryNetworkDelegatorFee
    : context.addSubnetDelegatorFee;

  const assetId = stakingAssetId ?? context.avaxAssetID;

  // Check if we use correct asset if on primary network
  if (isPrimaryNetwork && assetId !== context.avaxAssetID)
    throw new Error('Staking asset ID must be AVAX for the primary network.');

  const toBurn = new Map<string, bigint>([[context.avaxAssetID, fee]]);
  const toStake = new Map<string, bigint>([[assetId, weight]]);

  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);
  const { addressMaps, changeOutputs, inputUTXOs, inputs, stakeOutputs } =
    calculateUTXOSpend(
      toBurn,
      toStake,
      utxos,
      addressesFromBytes(fromAddressesBytes),
      defaultedOptions,
      [useSpendableLockedUTXOs, useUnlockedUTXOs, useConsolidateOutputs],
    );

  const delegatorTx = new AddPermissionlessDelegatorTx(
    AvaxBaseTx.fromNative(
      context.networkID,
      context.pBlockchainID,
      changeOutputs,
      inputs,
      defaultedOptions.memo,
    ),
    SubnetValidator.fromNative(
      nodeID,
      start,
      end,
      weight,
      Id.fromString(subnetID),
    ),
    stakeOutputs,
    OutputOwners.fromNative(rewardAddresses, locktime, threshold),
  );
  return new UnsignedTx(delegatorTx, inputUTXOs, addressMaps);
}

/**
 * @param context
 * @param utxos list of utxos to choose from
 * @param fromAddressesBytes used for filtering utxos
 * @param subnetID ID of the subnet
 * @param assetID ID of the subnet's staking asset
 * @param initialSupply the amount to initially specify as the current supply
 * @param maximumSupply the amount to specify as the maximum token supply
 * @param minConsumptionRate the rate to allocate funds if the validator's stake duration is 0
 * @param maxConsumptionRate the rate to allocate funds if the validator's stake duration is equal to the minting period
 * @param minValidatorStake the minimum amount of funds required to become a validator
 * @param maxValidatorStake the maximum amount of funds a single validator can be allocated, including delegated funds
 * @param minStakeDuration the minimum number of seconds a staker can stake for
 * @param maxStakeDuration the maximum number of seconds a staker can stake for
 * @param minDelegationFee the minimum percentage a validator must charge a delegator for delegating
 * @param minDelegatorStake the minimum amount of funds required to become a delegator
 * @param maxValidatorWeightFactor the factor which calculates the maximum amount of delegation a validator can receive
 * @param uptimeRequirement the minimum percentage a validator must be online and responsive to receive a reward
 * @param subnetAuth specifies indices of existing subnet owners
 * @param options used for filtering utxos
 * @returns UnsingedTx containing a TransformSubnetTx
 */
export function newTransformSubnetTx(
  context: Context,
  utxos: Utxo[],
  fromAddressesBytes: Uint8Array[],
  subnetID: string,
  assetID: string,
  initialSupply: bigint,
  maximumSupply: bigint,
  minConsumptionRate: bigint,
  maxConsumptionRate: bigint,
  minValidatorStake: bigint,
  maxValidatorStake: bigint,
  minStakeDuration: number,
  maxStakeDuration: number,
  minDelegationFee: number,
  minDelegatorStake: number,
  maxValidatorWeightFactor: number,
  uptimeRequirement: number,
  subnetAuth: number[],
  options?: SpendOptions,
) {
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);

  const { inputs, addressMaps, changeOutputs, inputUTXOs } = calculateUTXOSpend(
    new Map([[context.avaxAssetID, context.transformSubnetTxFee]]),
    undefined,
    utxos,
    addressesFromBytes(fromAddressesBytes),
    defaultedOptions,
    [useUnlockedUTXOs],
  );

  return new UnsignedTx(
    new TransformSubnetTx(
      AvaxBaseTx.fromNative(
        context.networkID,
        context.pBlockchainID,
        changeOutputs,
        inputs,
        defaultedOptions.memo,
      ),
      Id.fromString(subnetID),
      Id.fromString(assetID),
      new BigIntPr(initialSupply),
      new BigIntPr(maximumSupply),
      new BigIntPr(minConsumptionRate),
      new BigIntPr(maxConsumptionRate),
      new BigIntPr(minValidatorStake),
      new BigIntPr(maxValidatorStake),
      new Int(minStakeDuration),
      new Int(maxStakeDuration),
      new Int(minDelegationFee),
      new Int(minDelegatorStake),
      new Byte(hexToBuffer(maxValidatorWeightFactor.toString(16))),
      new Int(uptimeRequirement),
      Input.fromNative(subnetAuth),
    ),
    inputUTXOs,
    addressMaps,
  );
}

/**
 * @param context
 * @param utxos list of utxos to choose from
 * @param fromAddressesBytes used for filtering utxos
 * @param subnetID ID of the subnet
 * @param subnetAuth specifies indices of existing subnet owners
 * @param subnetOwners The new owner addresses
 * @param options used for filtering utxos
 * @param threshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
 * @param locktime Optional. The locktime field created in the resulting reward outputs
 * @returns UnsingedTx containing a TransferSubnetOwnershipTx
 */
export function newTransferSubnetOwnershipTx(
  context: Context,
  utxos: Utxo[],
  fromAddressesBytes: Uint8Array[],
  subnetID: string,
  subnetAuth: number[],
  subnetOwners: Uint8Array[],
  options?: SpendOptions,
  threshold = 1,
  locktime = 0n,
) {
  const defaultedOptions = defaultSpendOptions(fromAddressesBytes, options);

  const { inputs, addressMaps, changeOutputs, inputUTXOs } = calculateUTXOSpend(
    new Map([[context.avaxAssetID, context.baseTxFee]]),
    undefined,
    utxos,
    addressesFromBytes(fromAddressesBytes),
    defaultedOptions,
    [useUnlockedUTXOs],
  );

  return new UnsignedTx(
    new TransferSubnetOwnershipTx(
      AvaxBaseTx.fromNative(
        context.networkID,
        context.pBlockchainID,
        changeOutputs,
        inputs,
        defaultedOptions.memo,
      ),
      Id.fromString(subnetID),
      Input.fromNative(subnetAuth),
      OutputOwners.fromNative(subnetOwners, locktime, threshold),
    ),
    inputUTXOs,
    addressMaps,
  );
}
