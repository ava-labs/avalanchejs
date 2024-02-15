import {
  isExportTx as isEvmExportTx,
  isEvmTx,
  isImportExportTx,
} from '../serializable/evm';
import { isExportTx as isAvmExportTx } from '../serializable/avm';
import {
  isAddDelegatorTx,
  isAddPermissionlessDelegatorTx,
  isAddPermissionlessValidatorTx,
  isAddValidatorTx,
  isCreateSubnetTx,
  isExportTx as isPvmExportTx,
} from '../serializable/pvm';
import type { AvaxTx } from '../serializable/avax';
import type { EVMTx } from '../serializable/evm/abstractTx';
import type { TransferableOutput } from '../serializable/avax';
import type { OutputOwners } from '../serializable';

export const getTransferableOutputsByEvmTx = (tx: EVMTx) => {
  if (isImportExportTx(tx)) {
    return isEvmExportTx(tx) ? tx.exportedOutputs : [];
  }
  // Unreachable
  return [];
};

export const getTransferableOutputsByTx = (tx: AvaxTx | EVMTx) => {
  if (isEvmTx(tx)) {
    return getTransferableOutputsByEvmTx(tx);
  }
  if (isAvmExportTx(tx) || isPvmExportTx(tx)) {
    return [...(tx.baseTx?.outputs ?? []), ...(tx.outs ?? [])];
  } else if (
    isAddValidatorTx(tx) ||
    isAddDelegatorTx(tx) ||
    isAddPermissionlessValidatorTx(tx) ||
    isAddPermissionlessDelegatorTx(tx)
  ) {
    const outs: (TransferableOutput | OutputOwners)[] = [
      ...(tx.baseTx?.outputs ?? []),
      ...(tx.stake ?? []),
    ];

    if (isAddValidatorTx(tx)) {
      // validation reward + delegation reward after cortina upgrade
      outs.push(tx.getRewardsOwner(), tx.getRewardsOwner());
    } else if (isAddDelegatorTx(tx)) {
      outs.push(tx.getRewardsOwner());
    } else if (isAddPermissionlessValidatorTx(tx)) {
      outs.push(tx.getValidatorRewardsOwner(), tx.getDelegatorRewardsOwner());
    } else {
      outs.push(tx.getDelegatorRewardsOwner());
    }

    return outs;
  } else if (isCreateSubnetTx(tx)) {
    return [...tx.baseTx.outputs, tx.getSubnetOwners()];
  } else {
    // This covers base tx, import, other subnet related transactions
    return tx?.baseTx?.outputs ?? [];
  }
};
